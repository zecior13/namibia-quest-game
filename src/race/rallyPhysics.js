export const KMH_TO_MPS = 1 / 3.6;
export const MPS_TO_KMH = 3.6;

export const WHEEL_STATE = Object.freeze({
  ON_ROAD: "ON_ROAD",
  LEFT_OFF: "LEFT_OFF",
  RIGHT_OFF: "RIGHT_OFF",
  BOTH_OFF: "BOTH_OFF"
});

export const RALLY_SIMULATION = Object.freeze({
  fixedStep: 1 / 60,
  maxCatchUpSteps: 5,
  maxFrameDelta: 0.1,
  roadHalfWidth: 1,
  oneWheelBand: 0.14,
  hardOffroadLimit: 1.42
});

// Loaded expedition 4x4: slower than the Lotus/OutRun reference cars, but with
// the same arcade response model and enough momentum to make gravel demanding.
export const EXPEDITION_4X4 = Object.freeze({
  topSpeedKmh: 90,
  topSpeedMps: 90 * KMH_TO_MPS,
  hardLimitMps: 92 * KMH_TO_MPS,
  engineAccel: 10.2,
  accelExponent: 1.55,
  rollingResistance: 0.3,
  aeroResistance: 0.78,
  brakeDecel: 10.4,
  hillGravityScale: 0.2,
  topSpeedDamping: 4.5,

  steerRiseRate: 7.8,
  steerReverseRate: 10.5,
  steerReturnRate: 6.2,
  steeringDeadZone: 0.035,
  lowSpeedSteerStart: 0.08,
  lowSpeedSteerFull: 0.38,
  maxLateralSpeed: 1.34,
  highSpeedUndersteer: 0.17,
  lateralResponse: 5.4,

  curvePush: 1.02,
  curvePushBase: 0.08,
  curvePushSpeed: 1.48,
  baseGrip: 0.82,
  steerSlipDemand: 0.74,
  curveSlipDemand: 0.7,
  lateralSlipDemand: 0.17,
  highSpeedGripLoss: 0.1,
  slipWindow: 0.36,
  slipBuildRate: 2.8,
  slipRecoveryRate: 2.45,
  slipDrift: 0.7,
  slipSpeedLoss: 0.58,

  oneWheelTraction: 0.8,
  bothWheelsTraction: 0.68,
  oneWheelSteerFactor: 0.88,
  bothWheelsSteerFactor: 0.66,
  oneWheelOffroadDecel: 1.9,
  bothWheelsOffroadDecel: 2.6,
  oneWheelPull: 0.24
});

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const clamp01 = (value) => clamp(value, 0, 1);

function moveToward(value, target, maxDelta){
  if(Math.abs(target - value) <= maxDelta) return target;
  return value + Math.sign(target - value) * maxDelta;
}

export function createRallyState(overrides = {}){
  return {
    speedMps: 0,
    roadX: 0,
    lateralVelocity: 0,
    steering: 0,
    slip: 0,
    slipDirection: 0,
    wheelState: WHEEL_STATE.ON_ROAD,
    acceleration: 0,
    ...overrides
  };
}

export function getWheelState(roadX){
  const off = Math.abs(roadX) - RALLY_SIMULATION.roadHalfWidth;
  if(off <= 0) return WHEEL_STATE.ON_ROAD;
  if(off <= RALLY_SIMULATION.oneWheelBand){
    return roadX < 0 ? WHEEL_STATE.LEFT_OFF : WHEEL_STATE.RIGHT_OFF;
  }
  return WHEEL_STATE.BOTH_OFF;
}

function updateSteering(state, input, dt){
  const steerInput = Number.isFinite(input.steer) ? input.steer : 0;
  const rawTarget = Math.abs(steerInput) < EXPEDITION_4X4.steeringDeadZone ? 0 : clamp(steerInput, -1, 1);
  const reversing = rawTarget !== 0 && state.steering !== 0 && Math.sign(rawTarget) !== Math.sign(state.steering);
  const rate = rawTarget === 0
    ? EXPEDITION_4X4.steerReturnRate
    : reversing ? EXPEDITION_4X4.steerReverseRate : EXPEDITION_4X4.steerRiseRate;
  state.steering = moveToward(state.steering, rawTarget, rate * dt);
}

function updateLongitudinal(state, input, road, dt){
  const car = EXPEDITION_4X4;
  const throttleInput = clamp01(Number.isFinite(input.throttle) ? input.throttle : 0);
  const brakeInput = clamp01(Number.isFinite(input.brake) ? input.brake : 0);
  const grade = Number.isFinite(road.grade) ? road.grade : 0;
  const speedRatio = clamp01(state.speedMps / car.topSpeedMps);
  const oneWheelOff = state.wheelState === WHEEL_STATE.LEFT_OFF || state.wheelState === WHEEL_STATE.RIGHT_OFF;
  const bothOff = state.wheelState === WHEEL_STATE.BOTH_OFF;
  const traction = bothOff ? car.bothWheelsTraction : oneWheelOff ? car.oneWheelTraction : 1;
  const drive = throttleInput * car.engineAccel * Math.max(0, 1 - Math.pow(speedRatio, car.accelExponent)) * traction;
  const coast = (1 - throttleInput) * (car.rollingResistance + car.aeroResistance * speedRatio * speedRatio);
  const brake = brakeInput * car.brakeDecel * (bothOff ? 0.62 : oneWheelOff ? 0.82 : 1);
  const offroadDrag = bothOff ? car.bothWheelsOffroadDecel : oneWheelOff ? car.oneWheelOffroadDecel : 0;
  const hill = -grade * 9.81 * car.hillGravityScale;
  const slipLoss = state.slip * car.slipSpeedLoss;
  let acceleration = drive - coast - brake - offroadDrag + hill - slipLoss;

  if(state.speedMps > car.topSpeedMps){
    acceleration -= (state.speedMps - car.topSpeedMps) * car.topSpeedDamping;
  }
  state.acceleration = acceleration;
  state.speedMps = clamp(state.speedMps + acceleration * dt, 0, car.hardLimitMps);
}

function updateLateral(state, road, dt){
  const car = EXPEDITION_4X4;
  const curve = Number.isFinite(road.curve) ? road.curve : 0;
  const speedRatio = clamp01(state.speedMps / car.topSpeedMps);
  const movingRatio = clamp01(state.speedMps / (18 * KMH_TO_MPS));
  const steerAuthority = clamp(
    (speedRatio - car.lowSpeedSteerStart) / (car.lowSpeedSteerFull - car.lowSpeedSteerStart),
    0,
    1
  ) * movingRatio * (1 - car.highSpeedUndersteer * speedRatio * speedRatio);
  const oneWheelOff = state.wheelState === WHEEL_STATE.LEFT_OFF || state.wheelState === WHEEL_STATE.RIGHT_OFF;
  const bothOff = state.wheelState === WHEEL_STATE.BOTH_OFF;
  const terrainSteer = bothOff ? car.bothWheelsSteerFactor : oneWheelOff ? car.oneWheelSteerFactor : 1;
  const targetLateralVelocity = state.steering * car.maxLateralSpeed * steerAuthority * terrainSteer;
  const curvePush = curve * car.curvePush * movingRatio * (car.curvePushBase + car.curvePushSpeed * speedRatio * speedRatio);
  const gripLimit = car.baseGrip * (1 - car.highSpeedGripLoss * speedRatio) * (bothOff ? 0.58 : oneWheelOff ? 0.78 : 1);
  const totalDemand =
    Math.abs(state.steering) * speedRatio * car.steerSlipDemand +
    Math.abs(curve) * speedRatio * speedRatio * car.curveSlipDemand +
    Math.abs(targetLateralVelocity - state.lateralVelocity) * car.lateralSlipDemand;
  const slipTarget = clamp01((totalDemand - gripLimit) / car.slipWindow);
  const slipRate = slipTarget > state.slip ? car.slipBuildRate : car.slipRecoveryRate;
  state.slip = moveToward(state.slip, slipTarget, slipRate * dt);
  if(state.slip > 0.01){
    state.slipDirection = Math.sign(curvePush || state.lateralVelocity || state.steering || 1);
  }

  const response = car.lateralResponse * (1 - state.slip * 0.52) * (bothOff ? 0.68 : oneWheelOff ? 0.86 : 1);
  let pull = 0;
  if(state.wheelState === WHEEL_STATE.LEFT_OFF) pull = -car.oneWheelPull;
  if(state.wheelState === WHEEL_STATE.RIGHT_OFF) pull = car.oneWheelPull;
  const drift = state.slipDirection * state.slip * car.slipDrift * speedRatio;

  state.lateralVelocity += ((targetLateralVelocity - state.lateralVelocity) * response - curvePush + pull + drift) * dt;
  if(state.speedMps < 0.5){
    state.lateralVelocity = moveToward(state.lateralVelocity, 0, 5 * dt);
    return;
  }
  state.lateralVelocity = clamp(state.lateralVelocity, -2.2, 2.2);
  state.roadX = clamp(
    state.roadX + state.lateralVelocity * dt,
    -RALLY_SIMULATION.hardOffroadLimit,
    RALLY_SIMULATION.hardOffroadLimit
  );
}

export function stepRallyPhysics(state, input, road, dt){
  state.wheelState = getWheelState(state.roadX);
  updateSteering(state, input, dt);
  updateLateral(state, road, dt);
  state.wheelState = getWheelState(state.roadX);
  updateLongitudinal(state, input, road, dt);
  return state;
}

export function speedKmh(state){
  return state.speedMps * MPS_TO_KMH;
}
