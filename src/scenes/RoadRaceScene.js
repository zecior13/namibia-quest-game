import {
  EXPEDITION_4X4,
  RALLY_SIMULATION,
  WHEEL_STATE,
  createRallyState,
  speedKmh,
  stepRallyPhysics
} from "../race/rallyPhysics.js";
import { HEROES } from "../data/heroes.js";

const clamp = Phaser.Math.Clamp;

const FINISH_METERS = 10000;
const BASE_TIME_LIMIT_SECONDS = 400;
const SEGMENT_METERS = 10;
const SEGMENT_LENGTH = 200;
const ROAD_WIDTH = 1580;
const CAMERA_HEIGHT = 790;
const CAMERA_DEPTH = 0.9;
const PLAYER_Z = CAMERA_HEIGHT * CAMERA_DEPTH;
const PLAYER_COLLISION_AHEAD = (PLAYER_Z / SEGMENT_LENGTH) * SEGMENT_METERS;
const COLLISION_WINDOW_METERS = 3.8;
const HAZARD_COLLISION_WINDOW = Object.freeze({
  rocks: 3.8,
  tree: 4.4,
  oryx: 3.8,
  sand: 9,
  puddle: 7
});
const DRAW_DISTANCE = 135;
const PLAYER_HALF_WIDTH = 0.12;
const HAZARD_HALF_WIDTH = Object.freeze({
  rocks: 0.075,
  oryx: 0.07,
  sand: 0.22,
  puddle: 0.24,
  tree: 0.12
});

const COLORS = {
  sky: 0x8ca6a0,
  sandLight: 0xae7148,
  sandDark: 0xa36740,
  roadLight: 0x6c5039,
  roadDark: 0x624731,
  shoulderLight: 0xb48a57,
  shoulderDark: 0x956c42,
  rut: 0x3f3026,
  dust: 0xc08a54
};

function easeIn(a, b, percent){ return a + (b - a) * percent * percent; }
function easeInOut(a, b, percent){ return a + (b - a) * ((-Math.cos(percent * Math.PI) / 2) + 0.5); }
function percentRemaining(value, total){ return (value % total) / total; }

export class RoadRaceScene extends Phaser.Scene {
  constructor(){
    super("RoadRaceScene");
    this.resetSessionState();
  }

  resetSessionState(){
    this.touchSteer = 0;
    this.leftPointer = null;
    this.pedalPointer = null;
    this.gasHeld = false;
    this.brakeHeld = false;
    this.running = false;
    this.finished = false;
    this.waitingForLandscape = false;
    this.pedalLabels = {};
    this.vehicleVisualAngle = 0;
    this.wasRunningBeforeHide = false;
    this.briefing = null;
    this.leavingRace = false;
    this.resumeTimers = [];
    this.heroReaction = null;
    this.audioContext = null;
    this.engineAudio = null;
    this.musicClock = null;
    this.musicStep = 0;
  }

  create(){
    this.resetSessionState();
    this.cameras.main.setBackgroundColor("#182829");
    const save = JSON.parse(localStorage.getItem("namibiaQuestV2") || "{}");
    this.audioSettings = { music: save.music !== false, sfx: save.sfx !== false };
    this.hero = HEROES.find((hero) => hero.id === save.heroId) || HEROES[0];
    this.timeLimit = BASE_TIME_LIMIT_SECONDS + (this.hero.stats.tempo - 5) * 4;
    this.damageMultiplier = clamp(1 - (this.hero.stats.spokoj - 5) * 0.025, 0.88, 1.08);
    this.drive = {
      ...createRallyState(),
      meters: 0,
      position: 0,
      damage: 0,
      elapsed: 0,
      timeRemaining: this.timeLimit,
      sandSlowRemaining: 0,
      puddleSlowRemaining: 0,
      currentCurve: 0,
      slope: 0,
      offRoad: false,
      oneWheelOff: false
    };
    this.physicsAccumulator = 0;
    this.track = [];
    this.buildTrack();
    this.trackLength = this.track.length * SEGMENT_LENGTH;
    this.hazards = this.makeHazards();
    this.scenery = this.makeScenery();
    this.keys = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys("W,A,S,D");
    this.buildScene();
    this.scale.on("resize", this.layout, this);
    this.visibilityHandler = () => this.handleVisibilityChange();
    this.orientationHandler = () => this.scheduleViewportRefresh();
    document.addEventListener("visibilitychange", this.visibilityHandler);
    window.addEventListener("orientationchange", this.orientationHandler);
    this.events.once("shutdown", this.shutdown, this);
    this.layout();
    this.showBriefing();
  }

  buildTrack(){
    this.lastY = 0;
    this.curveWarnings = [];
    for(let chapter = 0; chapter < 3; chapter++){
      const direction = chapter % 2 === 0 ? 1 : -1;
      this.addRoad(5, 12, 5, 0.34 * direction, 2);
      this.addRoad(7, 16, 7, -0.82 * direction, 4);
      this.addRoad(6, 14, 6, 1.12 * direction, -3);
      this.addRoad(7, 16, 7, 0, -5);
      this.addRoad(9, 26, 9, -1.36 * direction, 6);
      this.addSCurve(direction, 4);
      this.addRoad(8, 24, 8, 0.74 * direction, -2);
      this.addRoad(7, 14, 7, 0, 3);
      this.addRoad(8, 24, 8, 1.28 * direction, 6);
      this.addSCurve(-direction, -3);
      this.addRoad(8, 20, 8, -1.46 * direction, 4);
      this.addRoad(6, 16, 6, 0.9 * direction, -5);
      this.addRoad(8, 20, 8, 0, 1);
    }
  }

  addSCurve(direction, hill){
    const warningMeters = this.track.length * SEGMENT_METERS;
    this.curveWarnings.push({ meters: warningMeters, direction });
    this.addRoad(5, 9, 5, 1.45 * direction, hill);
    this.addRoad(5, 7, 5, -1.5 * direction, -hill * 0.6);
  }

  addRoad(enter, hold, leave, curve, hill){
    const startY = this.lastY;
    const endY = startY + hill * SEGMENT_LENGTH;
    const total = enter + hold + leave;
    for(let n = 0; n < total; n++){
      const index = this.track.length;
      let segmentCurve;
      if(n < enter) segmentCurve = easeIn(0, curve, n / Math.max(1, enter));
      else if(n < enter + hold) segmentCurve = curve;
      else segmentCurve = easeInOut(curve, 0, (n - enter - hold) / Math.max(1, leave));
      const y1 = easeInOut(startY, endY, n / total);
      const y2 = easeInOut(startY, endY, (n + 1) / total);
      this.track.push({
        index,
        curve: segmentCurve,
        p1: { world: { x: 0, y: y1, z: index * SEGMENT_LENGTH }, camera: {}, screen: {} },
        p2: { world: { x: 0, y: y2, z: (index + 1) * SEGMENT_LENGTH }, camera: {}, screen: {} },
        sprites: [],
        visible: false,
        clip: 0
      });
    }
    this.lastY = endY;
  }

  buildScene(){
    this.backdrop = this.add.image(0, 0, "raceBackdrop").setOrigin(0.5, 0).setDepth(0);
    this.road = this.add.graphics().setDepth(2);
    this.sceneryLayer = this.add.container(0, 0).setDepth(5);
    this.sceneryViews = this.scenery.map((item) => {
      const image = this.add.image(0, 0, item.type === "tree" ? "raceAcacia" : "raceRocks")
        .setOrigin(0.5, 1).setVisible(false);
      this.sceneryLayer.add(image);
      return { item, image };
    });
    this.hazardLayer = this.add.container(0, 0).setDepth(7);
    this.hazardViews = this.hazards.map((hazard) => {
      const object = hazard.type === "sand" || hazard.type === "puddle"
        ? this.add.graphics()
        : this.add.image(0, 0, hazard.type === "oryx" ? "raceOryx" : hazard.type === "tree" ? "raceAcacia" : "raceRocks").setOrigin(0.5, 1);
      object.setVisible(false);
      this.hazardLayer.add(object);
      return { hazard, object };
    });

    this.vehicleShadow = this.add.ellipse(0, 0, 150, 28, 0x130e0a, 0.46).setDepth(10);
    this.vehicle = this.add.image(0, 0, "raceVehicleRear").setOrigin(0.5, 0.9).setDepth(11);
    this.dust = this.add.particles(0, 0, "raceRocks", {
      x: { min: -55, max: 55 }, y: { min: 0, max: 10 },
      lifespan: { min: 250, max: 620 }, speedX: { min: -70, max: 70 }, speedY: { min: -62, max: -18 },
      scale: { start: 0.013, end: 0.002 }, alpha: { start: 0.25, end: 0 },
      frequency: 70, quantity: 1, tint: COLORS.dust
    }).setDepth(9);
    this.flash = this.add.rectangle(0, 0, 10, 10, 0xf1d39b, 0).setOrigin(0).setDepth(30);
    this.addHud();
    this.addControls();
  }

  makeHazards(){
    const hazards = [];
    for(let block = 0; block < 5; block++){
      const mirror = block % 2 === 0 ? 1 : -1;
      const start = block * 2000;
      hazards.push(
        { type: "rocks", meters: start + 340, offset: -0.5 * mirror },
        { type: "sand", meters: start + 690, offset: 0.26 * mirror },
        { type: "puddle", meters: start + 1010, offset: -0.32 * mirror },
        { type: "tree", meters: start + 1390, offset: 0.72 * mirror },
        { type: "oryx", meters: start + 1740, offset: 1.08 * mirror, direction: -mirror }
      );
    }
    return hazards.map((hazard, id) => ({ ...hazard, id, hit: false }));
  }

  makeScenery(){
    const scenery = [];
    for(let meters = 120; meters < FINISH_METERS + 900; meters += 115){
      const seed = Math.floor(meters / 115);
      const type = seed % 5 === 0 || seed % 7 === 0 ? "tree" : "rocks";
      const side = seed % 2 === 0 ? -1 : 1;
      const distance = type === "tree" ? 1.45 + (seed % 4) * 0.24 : 1.22 + (seed % 5) * 0.2;
      scenery.push({ meters, type, side, offset: distance });
    }
    return scenery;
  }

  addHud(){
    this.hudShade = this.add.graphics().setDepth(20);
    const hudStyle = { fontFamily: "Georgia", fontStyle: "bold", color: "#ead6a8" };
    this.heroPortrait = this.add.image(0, 0, `heroPortrait-${this.hero.id}`).setOrigin(0).setDepth(22);
    this.heroFrame = this.add.graphics().setDepth(23);
    this.stageText = this.add.text(0, 0, "ROAD TO SPITZKOPPE  /  ODCINEK 1", { ...hudStyle, fontSize: "12px", letterSpacing: 1 }).setDepth(22);
    this.speedText = this.add.text(0, 0, "052", { ...hudStyle, fontSize: "31px", color: "#f4e3bb" }).setOrigin(1, 0).setDepth(22);
    this.speedUnit = this.add.text(0, 0, "KM/H", { ...hudStyle, fontSize: "9px", color: "#c79d5a" }).setOrigin(1, 0).setDepth(22);
    this.distanceText = this.add.text(0, 0, "2.20 KM", { ...hudStyle, fontSize: "12px" }).setDepth(22);
    this.timeText = this.add.text(0, 0, "01:55", { ...hudStyle, fontSize: "12px", color: "#f0d18e" }).setDepth(22);
    this.damageText = this.add.text(0, 0, "AUTO 100%", { ...hudStyle, fontSize: "11px", color: "#d8bd7c" }).setDepth(22);
    this.heroBonusText = this.add.text(0, 0, `TEMPO ${this.hero.stats.tempo}  ·  ${this.formatTime(this.timeLimit)}`, {
      ...hudStyle, fontSize: "8px", color: "#bfa36d"
    }).setDepth(22);
    this.gearText = this.add.text(0, 0, "II", { ...hudStyle, fontSize: "15px" }).setOrigin(0.5).setDepth(22);
    this.exitRaceButton = this.makeHudButton("WYJDŹ", () => this.leaveRace()).setDepth(31);
    this.message = this.add.text(0, 0, "", {
      ...hudStyle, fontSize: "15px", color: "#fff1c9", stroke: "#17110c", strokeThickness: 4, align: "center"
    }).setOrigin(0.5).setDepth(23).setAlpha(0);
    this.curveWarning = this.add.container(0, 0).setDepth(24).setVisible(false);
    this.curveWarningGraphic = this.add.graphics();
    this.curveWarningText = this.add.text(0, 19, "OSTRE S", {
      ...hudStyle, fontSize: "9px", color: "#f4dfaa", stroke: "#17110c", strokeThickness: 3
    }).setOrigin(0.5, 0);
    this.curveWarning.add([this.curveWarningGraphic, this.curveWarningText]);
    this.drawCurveWarningSign();
  }

  addControls(){
    this.controls = this.add.graphics().setDepth(18);
    this.steerThumb = this.add.circle(0, 0, 12, 0xd2ad67, 0.78).setDepth(19).setVisible(false);
    this.leftZone = this.add.zone(0, 0, 10, 10).setOrigin(0).setDepth(29).setInteractive();
    this.gasZone = this.add.zone(0, 0, 10, 10).setOrigin(0).setDepth(29).setInteractive();
    this.brakeZone = this.add.zone(0, 0, 10, 10).setOrigin(0).setDepth(29).setInteractive();
    this.leftZone.on("pointerdown", (pointer) => {
      this.leftPointer = { id: pointer.id, startX: pointer.x };
      this.steerThumb.setVisible(true).setPosition(pointer.x, pointer.y);
    });
    this.leftZone.on("pointermove", (pointer) => {
      if(!this.leftPointer || this.leftPointer.id !== pointer.id || !pointer.isDown) return;
      this.touchSteer = clamp((pointer.x - this.leftPointer.startX) / (this.scale.width * 0.15), -1, 1);
      this.steerThumb.setPosition(pointer.x, pointer.y);
    });
    this.leftZone.on("pointerup", (pointer) => this.releaseLeft(pointer));
    this.gasZone.on("pointerdown", (pointer) => { this.pedalPointer = pointer.id; this.gasHeld = true; });
    this.gasZone.on("pointerup", (pointer) => this.releasePedal(pointer));
    this.brakeZone.on("pointerdown", (pointer) => { this.pedalPointer = pointer.id; this.brakeHeld = true; });
    this.brakeZone.on("pointerup", (pointer) => this.releasePedal(pointer));
    this.input.on("pointerup", this.releaseControls, this);
    this.input.on("pointerupoutside", this.releaseControls, this);
  }

  makeHudButton(label, callback){
    const container = this.add.container(0, 0);
    const plate = this.add.graphics();
    plate.fillStyle(0x132a32, 0.96);
    plate.fillRoundedRect(-48, -18, 96, 36, 4);
    plate.lineStyle(2, 0xc69b58, 0.94);
    plate.strokeRoundedRect(-48, -18, 96, 36, 4);
    const text = this.add.text(0, 0, label, {
      fontFamily: "Georgia", fontSize: "11px", fontStyle: "bold", color: "#f0dfb7", letterSpacing: 1
    }).setOrigin(0.5);
    const zone = this.add.zone(0, 0, 108, 48).setInteractive({ useHandCursor: true });
    zone.on("pointerdown", (pointer, localX, localY, event) => {
      event?.stopPropagation();
      container.setScale(0.96);
      callback();
    });
    zone.on("pointerup", () => container.setScale(1));
    zone.on("pointerout", () => container.setScale(1));
    container.add([plate, text, zone]);
    container.label = text;
    return container;
  }

  releaseControls(pointer){ this.releaseLeft(pointer); this.releasePedal(pointer); }
  releaseLeft(pointer){
    if(!this.leftPointer || this.leftPointer.id !== pointer.id) return;
    this.leftPointer = null;
    this.touchSteer = 0;
    this.steerThumb.setVisible(false);
  }
  releasePedal(pointer){
    if(this.pedalPointer !== pointer.id) return;
    this.pedalPointer = null;
    this.gasHeld = false;
    this.brakeHeld = false;
  }

  layout(){
    const W = this.scale.width;
    const H = this.scale.height;
    this.landscape = W > H;
    const source = this.textures.get("raceBackdrop").getSourceImage();
    // The panorama must retain overscan because curves shift it horizontally.
    const bgScale = Math.max(W / source.width, H / source.height) * 1.5;
    this.backdropBaseScale = bgScale;
    this.backdrop.setScale(bgScale).setPosition(W / 2, -H * 0.08);
    this.flash.setSize(W, H);
    this.heroPortrait.setPosition(15, 8).setDisplaySize(44, 44);
    this.heroFrame.clear();
    this.heroFrame.lineStyle(2, 0xd4ad68, 0.92).strokeRect(13, 6, 48, 48);
    this.heroFrame.lineStyle(1, this.hero.color, 0.95).strokeRect(16, 9, 42, 42);
    this.stageText.setPosition(72, 9);
    this.distanceText.setPosition(72, 31);
    this.heroBonusText.setPosition(72, 49);
    this.speedText.setPosition(W - 23, 5);
    this.speedUnit.setPosition(W - 23, 39);
    this.timeText.setPosition(W * 0.64, 10);
    this.damageText.setPosition(W * 0.64, 36);
    this.gearText.setPosition(W - 30, 74);
    this.exitRaceButton.setPosition(W * 0.48, 25).setVisible(this.landscape && !this.leavingRace);
    this.message.setPosition(W / 2, 82);
    this.curveWarning.setPosition(W / 2, 102);
    const vehicleH = clamp(H * 0.4, 120, 184);
    this.vehicle.setScale(vehicleH / this.vehicle.height);
    this.vehicleBaseY = H - 8;
    this.vehicleShadow.setSize(vehicleH * 0.83, vehicleH * 0.12);
    const controlTop = H - Math.max(112, H * 0.34);
    this.leftZone.setPosition(0, controlTop).setSize(W * 0.58, H - controlTop);
    this.gasZone.setPosition(W * 0.78, controlTop).setSize(W * 0.22, (H - controlTop) * 0.47);
    this.brakeZone.setPosition(W * 0.78, controlTop + (H - controlTop) * 0.5).setSize(W * 0.22, (H - controlTop) * 0.5);
    this.drawHud();
    this.drawControlArtwork();
    if(this.briefing) this.positionBriefing();
    if(this.running && !this.landscape) this.pauseForPortrait();
    else if(this.waitingForLandscape && this.landscape) this.resumeAfterRotation();
  }

  drawHud(){
    const W = this.scale.width;
    this.hudShade.clear();
    this.hudShade.fillGradientStyle(0x10191a, 0x10191a, 0x10191a, 0x10191a, 0.9, 0.84, 0.08, 0);
    this.hudShade.fillRect(0, 0, W, 72);
    this.hudShade.lineStyle(1, 0xc19b59, 0.62).lineBetween(20, 59, W - 20, 59);
  }

  showBriefing(){
    this.running = false;
    this.briefing = this.add.container(0, 0).setDepth(60);
    this.briefShade = this.add.rectangle(0, 0, 10, 10, 0x071012, 0.93).setOrigin(0);
    this.briefRule = this.add.graphics();
    this.briefKicker = this.add.text(0, 0, "ROAD TO SPITZKOPPE", { fontFamily: "Georgia", fontSize: "13px", fontStyle: "bold", color: "#c99d5a", letterSpacing: 3 }).setOrigin(0.5);
    this.briefTitle = this.add.text(0, 0, "GRAVEL CROWN", { fontFamily: "Georgia", fontSize: "38px", fontStyle: "bold", color: "#f0dfb7" }).setOrigin(0.5);
    this.briefBody = this.add.text(0, 0, "", { fontFamily: "Georgia", fontSize: "15px", color: "#d9c7a0", align: "center", lineSpacing: 5 }).setOrigin(0.5);
    this.touchButton = this.makeBriefingButton("START", () => this.startRace());
    this.briefHint = this.add.text(0, 0, "Gaz u góry · hamulec na dole · lewa strefa skrętu", { fontFamily: "Georgia", fontSize: "11px", fontStyle: "bold", color: "#aa8954" }).setOrigin(0.5);
    this.briefing.add([this.briefShade, this.briefRule, this.briefKicker, this.briefTitle, this.briefBody, this.touchButton, this.briefHint]);
    this.positionBriefing();
  }

  makeBriefingButton(label, callback){
    const container = this.add.container(0, 0);
    const plate = this.add.graphics();
    const text = this.add.text(0, 0, label, { fontFamily: "Georgia", fontSize: "13px", fontStyle: "bold", color: "#f0dfb7", letterSpacing: 1 }).setOrigin(0.5);
    const zone = this.add.zone(0, 0, 170, 50).setInteractive({ useHandCursor: true });
    zone.on("pointerdown", callback);
    container.add([plate, text, zone]);
    container.plate = plate;
    container.zone = zone;
    return container;
  }

  positionBriefing(){
    const W = this.scale.width;
    const H = this.scale.height;
    const portrait = H >= W;
    this.briefShade.setSize(W, H);
    this.briefRule.clear().lineStyle(2, 0xc59a58, 0.9).lineBetween(W * 0.12, H * 0.23, W * 0.88, H * 0.23);
    this.briefKicker.setPosition(W / 2, H * 0.12);
    this.briefTitle.setPosition(W / 2, H * 0.29).setFontSize(clamp(W * 0.055, 27, 46));
    this.briefBody.setPosition(W / 2, H * 0.43).setWordWrapWidth(W * 0.72);
    this.briefBody.setText(portrait
      ? "Ta trasa działa poziomo. Wyłącz blokadę obrotu ekranu, wybierz sterowanie i obróć telefon. Gra ruszy dopiero po zmianie widoku."
      : `Dojedź 10 km do Spitzkoppe w ${this.formatTime(this.timeLimit)}. Czas albo zniszczenie auta kończą próbę. Piach, pobocze i woda odbierają prędkość.`);
    const buttonW = portrait ? clamp(W * 0.48, 168, 210) : clamp(W * 0.3, 180, 240);
    this.touchButton.setPosition(W / 2, H * 0.68);
    this.touchButton.plate.clear().fillStyle(0x183238, 0.96).fillRect(-buttonW / 2, -25, buttonW, 50).lineStyle(2, 0xc69b58, 0.92).strokeRect(-buttonW / 2, -25, buttonW, 50);
    this.touchButton.zone.setSize(buttonW, 50);
    this.briefHint.setPosition(W / 2, H * 0.81);
  }

  async startRace(){
    this.startRaceAudio();
    if(document.documentElement.requestFullscreen && !document.fullscreenElement){
      try { await document.documentElement.requestFullscreen(); } catch(error){ /* Safari may reject fullscreen. */ }
    }
    if(window.screen?.orientation?.lock){
      try { await window.screen.orientation.lock("landscape"); } catch(error){ /* iOS requires physical rotation. */ }
    }
    if(this.scale.height >= this.scale.width){
      this.waitingForLandscape = true;
      this.briefBody.setText("Obróć telefon poziomo. Jeśli ekran się nie obraca, wyłącz blokadę orientacji w Centrum sterowania.");
      return;
    }
    this.beginCountdown();
  }

  beginCountdown(){
    this.waitingForLandscape = false;
    this.briefing?.destroy(true);
    this.briefing = null;
    this.running = false;
    this.showMessage("3", 360);
    this.time.delayedCall(400, () => this.showMessage("2", 360));
    this.time.delayedCall(800, () => this.showMessage("1", 360));
    this.time.delayedCall(1200, () => { this.showMessage("JEDŹ!", 600); this.running = true; });
  }

  pauseForPortrait(){
    this.running = false;
    this.waitingForLandscape = true;
    if(!this.briefing) this.showBriefing();
    this.briefBody.setText("Trasa została zatrzymana. Obróć telefon poziomo, aby kontynuować.");
  }

  resumeAfterRotation(){
    this.waitingForLandscape = false;
    this.briefing?.destroy(true);
    this.briefing = null;
    this.physicsAccumulator = 0;
    this.showMessage("DALEJ!", 500);
    this.running = true;
  }

  handleVisibilityChange(){
    if(document.hidden){
      this.wasRunningBeforeHide = this.running && !this.finished;
      this.running = false;
      this.physicsAccumulator = 0;
      this.gasHeld = false;
      this.brakeHeld = false;
      this.touchSteer = 0;
      this.leftPointer = null;
      this.pedalPointer = null;
      this.steerThumb?.setVisible(false);
      return;
    }
    this.scheduleViewportRefresh();
    const resume = window.setTimeout(() => {
      if(!this.sys.isActive()) return;
      this.scale.refresh();
      this.layout();
      this.vehicle.setVisible(this.landscape);
      this.vehicleShadow.setVisible(this.landscape);
      if(!this.wasRunningBeforeHide || this.finished) return;
      this.wasRunningBeforeHide = false;
      if(this.scale.width > this.scale.height) this.resumeAfterRotation();
      else this.pauseForPortrait();
    }, 320);
    this.resumeTimers.push(resume);
  }

  scheduleViewportRefresh(){
    for(const timer of this.resumeTimers) window.clearTimeout(timer);
    this.resumeTimers = [80, 260, 620].map((delay) => window.setTimeout(() => {
      if(!this.sys.isActive()) return;
      this.scale.refresh();
      this.layout();
      if(this.scale.width > this.scale.height){
        this.vehicle.setVisible(true);
        this.vehicleShadow.setVisible(true);
      }
    }, delay));
  }

  update(time, deltaMs){
    this.drawControlArtwork();
    if(this.running && !this.finished){
      const frameDelta = Math.min(deltaMs / 1000, RALLY_SIMULATION.maxFrameDelta);
      this.physicsAccumulator += frameDelta;
      let steps = 0;
      while(this.physicsAccumulator >= RALLY_SIMULATION.fixedStep && steps < RALLY_SIMULATION.maxCatchUpSteps){
        this.updateDrive(RALLY_SIMULATION.fixedStep);
        this.physicsAccumulator -= RALLY_SIMULATION.fixedStep;
        steps++;
      }
      if(steps === RALLY_SIMULATION.maxCatchUpSteps){
        this.physicsAccumulator = Math.min(this.physicsAccumulator, RALLY_SIMULATION.fixedStep);
      }
    }else{
      this.physicsAccumulator = 0;
    }
    this.renderWorld();
    this.renderVehicle();
    this.updateHud();
  }

  updateDrive(dt){
    const drive = this.drive;
    const gas = this.gasHeld || this.keys.up.isDown || this.wasd.W.isDown;
    const brake = this.brakeHeld || this.keys.down.isDown || this.wasd.S.isDown;
    let steer = this.touchSteer;
    if(this.keys.left.isDown || this.wasd.A.isDown) steer = -1;
    if(this.keys.right.isDown || this.wasd.D.isDown) steer = 1;
    const playerSegment = this.findSegment(drive.position + PLAYER_Z);
    drive.currentCurve = playerSegment.curve;
    drive.slope = (playerSegment.p2.world.y - playerSegment.p1.world.y) / SEGMENT_LENGTH;
    stepRallyPhysics(drive, {
      throttle: gas ? 1 : 0,
      brake: brake ? 1 : 0,
      steer
    }, {
      curve: playerSegment.curve,
      grade: drive.slope
    }, dt);
    drive.oneWheelOff = drive.wheelState === WHEEL_STATE.LEFT_OFF || drive.wheelState === WHEEL_STATE.RIGHT_OFF;
    drive.offRoad = drive.wheelState === WHEEL_STATE.BOTH_OFF;
    if(Math.abs(drive.roadX) >= 1.42){
      drive.roadX = clamp(drive.roadX, -1.42, 1.42);
      drive.lateralVelocity *= -0.16;
    }
    const currentKmh = speedKmh(drive);
    if(drive.offRoad && currentKmh > 94) drive.damage += 1.25 * dt;
    else if(drive.oneWheelOff && currentKmh > 125) drive.damage += 0.35 * dt;
    if(drive.offRoad && drive.speedMps > 22 / 3.6){
      drive.speedMps = Math.max(22 / 3.6, drive.speedMps - 18 * dt);
    }
    if(drive.sandSlowRemaining > 0){
      drive.sandSlowRemaining = Math.max(0, drive.sandSlowRemaining - dt);
      drive.speedMps = Math.min(drive.speedMps, 10 / 3.6);
    }
    if(drive.puddleSlowRemaining > 0){
      drive.puddleSlowRemaining = Math.max(0, drive.puddleSlowRemaining - dt);
      drive.speedMps = Math.min(drive.speedMps, 20 / 3.6);
    }
    const metersPerSecond = drive.speedMps;
    drive.meters += metersPerSecond * dt;
    drive.position += metersPerSecond * dt * (SEGMENT_LENGTH / SEGMENT_METERS);
    drive.elapsed += dt;
    drive.timeRemaining = Math.max(0, drive.timeRemaining - dt);
    this.handleHazards();
    if(drive.damage >= 100) this.endRace(false, "AUTO NIE WYTRZYMAŁO TRASY");
    else if(drive.timeRemaining <= 0) this.endRace(false, "CZAS MINĄŁ");
    else if(drive.meters >= FINISH_METERS) this.endRace(true, "SPITZKOPPE NA HORYZONCIE");
  }

  handleHazards(){
    for(const hazard of this.hazards){
      if(hazard.hit) continue;
      const ahead = hazard.meters - this.drive.meters;
      const collisionWindow = HAZARD_COLLISION_WINDOW[hazard.type] || COLLISION_WINDOW_METERS;
      if(Math.abs(ahead - PLAYER_COLLISION_AHEAD) > collisionWindow) continue;
      const offset = this.hazardOffset(hazard, ahead);
      const separation = Math.abs(offset - this.drive.roadX);
      const contactWidth = PLAYER_HALF_WIDTH + HAZARD_HALF_WIDTH[hazard.type];
      if(separation >= contactWidth) continue;
      hazard.hit = true;
      if(hazard.type === "rocks"){
        this.drive.damage += 28 * this.damageMultiplier;
        this.drive.speedMps *= 0.42;
        this.cameras.main.shake(250, 0.014);
        this.flashHit();
        this.triggerHeroReaction("hit", 900);
        this.playRaceSfx("impact");
        this.showMessage("SKAŁY!", 850);
      }else if(hazard.type === "tree"){
        this.drive.damage += 34 * this.damageMultiplier;
        this.drive.speedMps *= 0.22;
        this.drive.lateralVelocity = (this.drive.roadX < offset ? -0.9 : 0.9);
        this.drive.roadX += this.drive.roadX < offset ? -0.09 : 0.09;
        this.cameras.main.shake(300, 0.017);
        this.flashHit();
        this.triggerHeroReaction("hit", 1100);
        this.playRaceSfx("impact");
        this.showMessage("AKACJA!  ·  AUTO USZKODZONE", 1200);
      }else if(hazard.type === "oryx"){
        this.drive.damage += 7 * this.damageMultiplier;
        this.drive.speedMps *= 0.32;
        this.triggerHeroReaction("shock", 1000);
        this.playRaceSfx("brake");
        this.showMessage("HAMOWANIE AWARYJNE", 1000);
      }else if(hazard.type === "sand"){
        this.drive.speedMps = Math.min(this.drive.speedMps, 10 / 3.6);
        this.drive.sandSlowRemaining = Math.max(1.75, 2.45 - Math.max(0, this.hero.stats.sila - 5) * 0.12);
        this.triggerHeroReaction("sand", 1600);
        this.playRaceSfx("sand");
        this.showMessage("MIĘKKI PIASEK  ·  PRĘDKOŚĆ 10 KM/H", 2100);
      }else if(hazard.type === "puddle"){
        this.drive.speedMps = Math.min(this.drive.speedMps, 20 / 3.6);
        this.drive.puddleSlowRemaining = 1.5;
        this.triggerSplash();
        this.triggerHeroReaction("splash", 1200);
        this.playRaceSfx("splash");
        this.showMessage("GŁĘBOKA KAŁUŻA  ·  20 KM/H", 1500);
      }
    }
  }

  hazardOffset(hazard, ahead){
    if(hazard.type !== "oryx") return hazard.offset;
    // The animal reaches the road centre at the same depth as the player's car.
    const progress = clamp((80 - ahead) / 90, 0, 1);
    return Phaser.Math.Linear(hazard.offset, -hazard.offset, progress);
  }

  findSegment(position){
    return this.track[Math.floor(position / SEGMENT_LENGTH) % this.track.length];
  }

  project(point, cameraX, cameraY, cameraZ, W, H){
    point.camera.x = point.world.x - cameraX;
    point.camera.y = point.world.y - cameraY;
    point.camera.z = point.world.z - cameraZ;
    point.screen.scale = (this.projectionDepth || CAMERA_DEPTH) / Math.max(0.001, point.camera.z);
    point.screen.x = Math.round((W / 2) + point.screen.scale * point.camera.x * W / 2);
    point.screen.y = Math.round(this.horizonY - point.screen.scale * point.camera.y * H / 2);
    point.screen.w = Math.round(point.screen.scale * ROAD_WIDTH * W / 2);
  }

  projectedPoint(segment, ratio){
    return {
      x: Phaser.Math.Linear(segment.p1.screen.x, segment.p2.screen.x, ratio),
      y: Phaser.Math.Linear(segment.p1.screen.y, segment.p2.screen.y, ratio),
      w: Phaser.Math.Linear(segment.p1.screen.w, segment.p2.screen.w, ratio),
      scale: Phaser.Math.Linear(segment.p1.screen.scale, segment.p2.screen.scale, ratio)
    };
  }

  renderWorld(){
    const W = this.scale.width;
    const H = this.scale.height;
    if(!this.landscape){
      this.road.clear();
      this.hideWorldSprites();
      return;
    }
    const baseSegment = this.findSegment(this.drive.position);
    const baseIndex = baseSegment.index;
    const basePercent = percentRemaining(this.drive.position, SEGMENT_LENGTH);
    const playerSegment = this.findSegment(this.drive.position + PLAYER_Z);
    const playerPercent = percentRemaining(this.drive.position + PLAYER_Z, SEGMENT_LENGTH);
    const playerY = Phaser.Math.Linear(playerSegment.p1.world.y, playerSegment.p2.world.y, playerPercent);
    const speedRatio = clamp(this.drive.speedMps / EXPEDITION_4X4.topSpeedMps, 0, 1);
    this.projectionDepth = CAMERA_DEPTH * Phaser.Math.Linear(0.84, 1.3, speedRatio);
    const accelerationPitch = clamp(this.drive.acceleration / 12, -0.035, 0.025);
    const hillPitch = clamp(this.drive.slope * 0.09, -0.035, 0.035);
    this.horizonY = H * (0.36 + accelerationPitch + hillPitch);
    let x = 0;
    const curveProjection = 28;
    let dx = -(baseSegment.curve * basePercent * curveProjection);
    let maxY = H;
    this.road.clear();
    for(const segment of this.track) segment.visible = false;
    const visible = [];
    for(let n = 0; n < DRAW_DISTANCE; n++){
      const segment = this.track[(baseIndex + n) % this.track.length];
      const looped = segment.index < baseIndex;
      const cameraZ = this.drive.position - (looped ? this.trackLength : 0);
      const cameraFollow = this.drive.roadX * 0.78 + this.drive.lateralVelocity * 0.035;
      this.project(segment.p1, (cameraFollow * ROAD_WIDTH) - x, playerY + CAMERA_HEIGHT, cameraZ, W, H);
      this.project(segment.p2, (cameraFollow * ROAD_WIDTH) - x - dx, playerY + CAMERA_HEIGHT, cameraZ, W, H);
      x += dx;
      dx += segment.curve * curveProjection;
      if(segment.p1.camera.z <= CAMERA_DEPTH || segment.p2.screen.y >= maxY) continue;
      segment.visible = true;
      segment.clip = maxY;
      visible.push({ segment, distance: n });
      maxY = segment.p2.screen.y;
    }
    for(let n = visible.length - 1; n >= 0; n--){
      this.renderSegment(visible[n].segment, visible[n].distance, W);
    }
    const visibleSegments = visible.map((entry) => entry.segment);
    this.visibleSegments = visibleSegments;
    this.renderScenery(visibleSegments);
    this.renderHazards(visibleSegments);
    const bend = clamp(baseSegment.curve * 0.075 + this.drive.roadX * 0.018, -0.082, 0.082);
    this.backdrop.x = W / 2 - bend * W;
    this.backdrop.y = -H * 0.08 + (speedRatio * 1.5) + clamp(this.drive.slope * H * 0.035, -7, 7);
  }

  renderSegment(segment, index, W){
    const p1 = segment.p1.screen;
    const p2 = segment.p2.screen;
    const alternate = Math.floor(segment.index / 3) % 2;
    const shoulder = alternate ? COLORS.shoulderLight : COLORS.shoulderDark;
    const road = alternate ? COLORS.roadLight : COLORS.roadDark;
    const sand = alternate ? COLORS.sandLight : COLORS.sandDark;
    const shoulderScale = 1.14;
    this.quad(sand, -W * 1.5, p1.y, p1.x - p1.w * shoulderScale, p1.y, p2.x - p2.w * shoulderScale, p2.y, -W * 1.5, p2.y);
    this.quad(sand, p1.x + p1.w * shoulderScale, p1.y, W * 2.5, p1.y, W * 2.5, p2.y, p2.x + p2.w * shoulderScale, p2.y);
    this.quad(shoulder, p1.x - p1.w * shoulderScale, p1.y, p1.x + p1.w * shoulderScale, p1.y, p2.x + p2.w * shoulderScale, p2.y, p2.x - p2.w * shoulderScale, p2.y);
    this.quad(road, p1.x - p1.w, p1.y, p1.x + p1.w, p1.y, p2.x + p2.w, p2.y, p2.x - p2.w, p2.y);
    if(index < 82){
      const rutAlpha = clamp(0.1 + (1 - index / 72) * 0.18, 0.08, 0.28);
      this.road.lineStyle(Math.max(1, p1.w * 0.012), COLORS.rut, rutAlpha);
      this.road.lineBetween(p1.x - p1.w * 0.36, p1.y, p2.x - p2.w * 0.36, p2.y);
      this.road.lineBetween(p1.x + p1.w * 0.36, p1.y, p2.x + p2.w * 0.36, p2.y);
    }
    if(index < 48 && segment.index % 5 === 0){
      const gritAlpha = clamp(0.06 + (1 - index / 48) * 0.2, 0.06, 0.25);
      this.road.lineStyle(Math.max(1, p1.w * 0.008), 0xd4ad72, gritAlpha);
      this.road.lineBetween(p1.x - p1.w * 0.72, p1.y, p2.x - p2.w * 0.72, p2.y);
      this.road.lineBetween(p1.x + p1.w * 0.72, p1.y, p2.x + p2.w * 0.72, p2.y);
    }
  }

  quad(color, x1, y1, x2, y2, x3, y3, x4, y4){
    this.road.fillStyle(color, 1);
    this.road.fillPoints([
      new Phaser.Geom.Point(x1, y1), new Phaser.Geom.Point(x2, y2),
      new Phaser.Geom.Point(x3, y3), new Phaser.Geom.Point(x4, y4)
    ], true);
  }

  renderScenery(visible){
    const visibleByIndex = new Map(visible.map((segment) => [segment.index, segment]));
    for(const view of this.sceneryViews){
      const { item, image } = view;
      const ahead = item.meters - this.drive.meters;
      if(ahead < -15 || ahead > DRAW_DISTANCE * SEGMENT_METERS){ image.setVisible(false); continue; }
      const index = Math.floor(item.meters / SEGMENT_METERS) % this.track.length;
      const segment = visibleByIndex.get(index);
      if(!segment){ image.setVisible(false); continue; }
      const ratio = (item.meters % SEGMENT_METERS) / SEGMENT_METERS;
      const point = this.projectedPoint(segment, ratio);
      const x = point.x + point.w * item.offset * item.side;
      const y = point.y + 1;
      if(y < this.horizonY || y > this.scale.height + 8){
        image.setVisible(false);
        continue;
      }
      const targetH = (item.type === "tree" ? 1320 : 500) * point.scale * this.scale.height * 0.5;
      const horizonFade = clamp((y - this.horizonY) / 68, 0, 1);
      const distanceFade = clamp((DRAW_DISTANCE * SEGMENT_METERS - ahead) / 180, 0, 1);
      image.setVisible(true).setAlpha(horizonFade * distanceFade).setPosition(x, y).setScale(targetH / image.height).setFlipX(item.side < 0).setDepth(Math.floor(y));
    }
  }

  renderHazards(visible){
    const visibleByIndex = new Map(visible.map((segment) => [segment.index, segment]));
    for(const view of this.hazardViews){
      const { hazard, object } = view;
      const index = Math.floor(hazard.meters / SEGMENT_METERS) % this.track.length;
      const segment = visibleByIndex.get(index);
      if(!segment || hazard.meters < this.drive.meters - 12){ object.setVisible(false); continue; }
      const ahead = hazard.meters - this.drive.meters;
      const offset = this.hazardOffset(hazard, ahead);
      const ratio = (hazard.meters % SEGMENT_METERS) / SEGMENT_METERS;
      const point = this.projectedPoint(segment, ratio);
      const x = point.x + point.w * offset;
      const y = point.y;
      const scale = point.scale;
      object.setVisible(true).setPosition(x, y).setDepth(Math.floor(y) + 1);
      if(hazard.type === "sand"){
        object.clear();
        const width = Math.max(8, point.w * HAZARD_HALF_WIDTH.sand * 2);
        const height = Math.max(3, width * 0.22);
        const edge = [];
        for(let n = 0; n < 18; n++){
          const angle = (n / 18) * Math.PI * 2;
          const wobble = 0.86 + Math.sin(n * 2.7 + hazard.id) * 0.08;
          edge.push(new Phaser.Geom.Point(
            Math.cos(angle) * width * 0.5 * wobble,
            -height * 0.42 + Math.sin(angle) * height * 0.5 * wobble
          ));
        }
        object.fillStyle(0x63472f, 0.35).fillEllipse(0, -height * 0.25, width * 1.04, height * 0.92);
        object.fillStyle(0xb67c45, 0.98).fillPoints(edge, true);
        object.fillStyle(0x8e6039, 0.68).fillEllipse(0, -height * 0.38, width * 0.74, height * 0.44);
        object.lineStyle(Math.max(1, height * 0.055), 0xd5ab6d, 0.62);
        for(let n = -2; n <= 2; n++){
          object.beginPath();
          object.moveTo(n * width * 0.15, -height * 0.78);
          object.lineTo(n * width * 0.11, -height * 0.12);
          object.strokePath();
        }
        object.lineStyle(Math.max(1, height * 0.04), 0x62432e, 0.48);
        object.strokeEllipse(0, -height * 0.38, width * 0.53, height * 0.24);
      }else if(hazard.type === "puddle"){
        object.clear();
        const width = Math.max(10, point.w * HAZARD_HALF_WIDTH.puddle * 2);
        const height = Math.max(3, width * 0.19);
        const ripple = 0.93 + Math.sin(this.time.now * 0.006 + hazard.id) * 0.04;
        object.fillStyle(0x315d68, 0.42).fillEllipse(0, -height * 0.2, width * 1.06, height);
        object.fillStyle(0x4f8b94, 0.72).fillEllipse(0, -height * 0.32, width * ripple, height * 0.7);
        object.lineStyle(Math.max(1, height * 0.06), 0xa7d0cd, 0.7).strokeEllipse(0, -height * 0.34, width * 0.68 * ripple, height * 0.35);
        object.lineStyle(Math.max(1, height * 0.04), 0x1f4a55, 0.62).strokeEllipse(0, -height * 0.3, width * 0.38, height * 0.18);
      }else{
        const targetH = (hazard.type === "oryx" ? 440 : hazard.type === "tree" ? 1180 : 300) * scale * this.scale.height * 0.5;
        object.setScale(targetH / object.height).setFlipX(hazard.type === "oryx" && hazard.direction < 0);
      }
    }
  }

  hideWorldSprites(){
    for(const view of this.sceneryViews) view.image.setVisible(false);
    for(const view of this.hazardViews) view.object.setVisible(false);
  }

  renderVehicle(){
    const W = this.scale.width;
    const H = this.scale.height;
    if(!this.landscape){ this.vehicle.setVisible(false); this.vehicleShadow.setVisible(false); return; }
    this.vehicle.setVisible(true);
    this.vehicleShadow.setVisible(true);
    const speedRatio = clamp(this.drive.speedMps / EXPEDITION_4X4.topSpeedMps, 0, 1);
    const movingRatio = clamp(this.drive.speedMps / (18 / 3.6), 0, 1);
    const rawX = W / 2 + this.drive.roadX * W * 0.36 + this.drive.lateralVelocity * W * 0.018;
    const x = clamp(rawX, this.vehicle.displayWidth * 0.34, W - this.vehicle.displayWidth * 0.34);
    const pitch = clamp(this.drive.slope * -1.8, -2.8, 2.8);
    const targetAngle = clamp(
      this.drive.steering * movingRatio * (9 + speedRatio * 8) +
      this.drive.lateralVelocity * 3.2 +
      this.drive.slipDirection * this.drive.slip * 6.2,
      -18,
      18
    );
    this.vehicleVisualAngle += (targetAngle - this.vehicleVisualAngle) * 0.24;
    const roadTexture = Math.sin(this.drive.position * 0.019) * 0.7 + Math.sin(this.drive.position * 0.043) * 0.28;
    const terrainRoughness = this.drive.offRoad ? 2.2 : this.drive.oneWheelOff ? 1.1 : 0.48;
    const movingRoughness = this.running ? roadTexture * speedRatio * terrainRoughness : 0;
    const offRoadRoughness = this.running && this.drive.offRoad ? Math.sin(this.drive.position * 0.087) * speedRatio * 1.2 : 0;
    const y = this.vehicleBaseY + movingRoughness + offRoadRoughness;
    this.vehicle.setPosition(x, y).setAngle(this.vehicleVisualAngle + pitch * 0.15);
    this.vehicleShadow.setPosition(x, y - this.vehicle.displayHeight * 0.03).setAngle(this.vehicleVisualAngle * 0.32);
    this.dust.setPosition(x, y - this.vehicle.displayHeight * 0.06);
    const currentKmh = speedKmh(this.drive);
    const dustOn = currentKmh > 25 && (this.drive.offRoad || this.drive.oneWheelOff || currentKmh > 92);
    this.dust.setFrequency(dustOn ? clamp(94 - currentKmh * 0.34, 26, 90) : -1);
    this.renderHeroReaction(speedRatio);
  }

  renderHeroReaction(speedRatio){
    if(!this.heroPortrait?.visible) return;
    const active = this.heroReaction && this.time.now < this.heroReaction.until;
    const highSpeedStress = clamp((speedRatio - (0.48 + this.hero.stats.tempo * 0.025)) / 0.25, 0, 1);
    let angle = Math.sin(this.time.now * 0.025) * highSpeedStress * 1.6;
    let scale = 1 + highSpeedStress * 0.035;
    let x = 15;
    if(active){
      const strength = this.heroReaction.type === "hit" ? 3.2 : 1.7;
      x += Math.sin(this.time.now * 0.08) * strength;
      angle += Math.sin(this.time.now * 0.06) * strength;
      scale += this.heroReaction.type === "shock" ? 0.07 : 0.035;
    }
    const reactionKey = `heroReaction-${this.hero.id}`;
    const targetTexture = active && this.textures.exists(reactionKey) ? reactionKey : `heroPortrait-${this.hero.id}`;
    if(this.heroPortrait.texture.key !== targetTexture) this.heroPortrait.setTexture(targetTexture);
    this.heroPortrait.setPosition(x, 8).setScale(1).setDisplaySize(44 * scale, 44 * scale).setAngle(angle);
  }

  triggerHeroReaction(type, duration){
    this.heroReaction = { type, until: this.time.now + duration };
  }

  drawControlArtwork(){
    if(!this.controls || !this.landscape) return;
    const W = this.scale.width;
    const H = this.scale.height;
    const top = H - Math.max(112, H * 0.34);
    const steeringX = W * 0.17;
    const steeringY = H - 42;
    this.controls.clear();
    const wheelR = W * 0.105;
    this.controls.lineStyle(10, 0x2a2019, 0.66);
    this.controls.beginPath().arc(steeringX, steeringY + 10, wheelR, Math.PI * 1.08, Math.PI * 1.92, false).strokePath();
    this.controls.lineStyle(3, 0xb48a52, 0.68);
    this.controls.beginPath().arc(steeringX, steeringY + 10, wheelR, Math.PI * 1.08, Math.PI * 1.92, false).strokePath();
    this.controls.lineStyle(6, 0x2a2019, 0.62);
    this.controls.lineBetween(steeringX, steeringY + 5, steeringX - wheelR * 0.72, steeringY - wheelR * 0.36);
    this.controls.lineBetween(steeringX, steeringY + 5, steeringX + wheelR * 0.72, steeringY - wheelR * 0.36);
    this.controls.fillStyle(0x3a2c21, 0.72).fillCircle(steeringX, steeringY + 5, 13);
    this.controls.lineStyle(2, 0xc39a5a, 0.72).strokeCircle(steeringX, steeringY + 5, 13);
    this.paintPedal(W * 0.87, top + 2, W * 0.09, (H - top) * 0.42, "GAZ", this.gasHeld);
    this.paintPedal(W * 0.87, top + (H - top) * 0.53, W * 0.12, (H - top) * 0.42, "HAMULEC", this.brakeHeld);
  }

  paintPedal(cx, y, width, height, label, active){
    const x = cx - width / 2;
    this.controls.fillStyle(active ? 0x8c4b2a : 0x142b2e, active ? 0.82 : 0.46).fillRoundedRect(x, y + (active ? 3 : 0), width, height - (active ? 3 : 0), 5);
    this.controls.lineStyle(2, active ? 0xf0ce82 : 0xb58d50, active ? 0.94 : 0.56).strokeRoundedRect(x, y + (active ? 3 : 0), width, height - (active ? 3 : 0), 5);
    if(!this.pedalLabels) this.pedalLabels = {};
    if(!this.pedalLabels[label]) this.pedalLabels[label] = this.add.text(0, 0, label, { fontFamily: "Georgia", fontSize: "9px", fontStyle: "bold", color: "#ead4a4" }).setOrigin(0.5).setDepth(19);
    this.pedalLabels[label].setVisible(this.landscape).setPosition(cx, y + height / 2 + (active ? 2 : 0));
  }

  updateHud(){
    const remaining = Math.max(0, FINISH_METERS - this.drive.meters) / 1000;
    const currentKmh = speedKmh(this.drive);
    this.speedText.setText(String(Math.round(currentKmh)).padStart(3, "0"));
    this.distanceText.setText(`${remaining.toFixed(2)} KM`);
    this.timeText.setText(`CZAS ${this.formatTime(this.drive.timeRemaining)}`)
      .setColor(this.drive.timeRemaining < 20 ? "#e47a55" : "#f0d18e");
    this.damageText.setText(`AUTO ${Math.max(0, Math.round(100 - this.drive.damage))}%`).setColor(this.drive.damage > 65 ? "#d67652" : "#d8bd7c");
    this.gearText.setText(currentKmh < 30 ? "I" : currentKmh < 85 ? "II" : currentKmh < 135 ? "III" : "IV");
    this.updateCurveWarning();
    this.updateRaceAudio(currentKmh);
  }

  drawCurveWarningSign(){
    const g = this.curveWarningGraphic;
    g.clear();
    g.fillStyle(0xd0a252, 0.96).fillTriangle(0, -30, -24, 12, 24, 12);
    g.lineStyle(3, 0x231a13, 0.92).strokeTriangle(0, -30, -24, 12, 24, 12);
    g.lineStyle(4, 0x2b2118, 0.96);
    g.beginPath();
    g.moveTo(-7, 4);
    g.lineTo(2, 1);
    g.lineTo(7, -4);
    g.lineTo(4, -10);
    g.lineTo(-3, -14);
    g.lineTo(7, -20);
    g.strokePath();
  }

  updateCurveWarning(){
    if(!this.curveWarning) return;
    const next = this.curveWarnings.find((warning) => warning.meters >= this.drive.meters - 20);
    const ahead = next ? next.meters - this.drive.meters : Infinity;
    this.curveWarning.setVisible(this.running && ahead > -10 && ahead < 260);
    if(this.curveWarning.visible) this.curveWarning.setAlpha(clamp((260 - ahead) / 90, 0.38, 1));
  }

  triggerSplash(){
    if(!this.vehicle?.visible) return;
    const x = this.vehicle.x;
    const y = this.vehicle.y - this.vehicle.displayHeight * 0.08;
    const splash = this.add.graphics().setDepth(12).setPosition(x, y);
    splash.fillStyle(0xaed7d3, 0.82);
    splash.fillEllipse(-42, 0, 58, 12).fillEllipse(42, 0, 58, 12);
    splash.lineStyle(4, 0x6eaeb3, 0.9);
    for(const side of [-1, 1]){
      for(let n = 0; n < 4; n++){
        splash.beginPath();
        splash.moveTo(side * (24 + n * 7), 0);
        splash.lineTo(side * (38 + n * 10), -18 - n * 6);
        splash.strokePath();
      }
    }
    this.tweens.add({ targets: splash, alpha: 0, scaleX: 1.35, scaleY: 1.7, y: y - 18, duration: 520, onComplete: () => splash.destroy() });
  }

  startRaceAudio(){
    if(this.audioContext) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if(!AudioContextClass) return;
    this.audioContext = new AudioContextClass();
    this.audioContext.resume?.();
    if(this.audioSettings.sfx){
      const oscillator = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      oscillator.type = "sawtooth";
      oscillator.frequency.value = 42;
      gain.gain.value = 0.018;
      oscillator.connect(gain).connect(this.audioContext.destination);
      oscillator.start();
      this.engineAudio = { oscillator, gain };
    }
    if(this.audioSettings.music){
      this.musicClock = window.setInterval(() => this.playMusicNote(), 430);
    }
  }

  updateRaceAudio(kmh){
    if(!this.engineAudio || !this.audioContext) return;
    const now = this.audioContext.currentTime;
    this.engineAudio.oscillator.frequency.setTargetAtTime(42 + kmh * 0.72, now, 0.06);
    this.engineAudio.gain.gain.setTargetAtTime(this.running ? 0.012 + kmh / 13000 : 0.004, now, 0.08);
  }

  playMusicNote(){
    if(!this.audioContext || !this.running || !this.audioSettings.music) return;
    const notes = [110, 146.83, 164.81, 146.83, 123.47, 164.81, 196, 164.81];
    const now = this.audioContext.currentTime;
    const oscillator = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    oscillator.type = this.musicStep % 4 === 0 ? "triangle" : "sine";
    oscillator.frequency.value = notes[this.musicStep++ % notes.length];
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.022, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);
    oscillator.connect(gain).connect(this.audioContext.destination);
    oscillator.start(now); oscillator.stop(now + 0.36);
  }

  playRaceSfx(type){
    if(!this.audioContext || !this.audioSettings.sfx) return;
    const now = this.audioContext.currentTime;
    const oscillator = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const settings = {
      impact: [70, 30, "sawtooth", 0.12], brake: [180, 70, "square", 0.05],
      sand: [95, 45, "triangle", 0.055], splash: [240, 85, "sine", 0.07]
    }[type] || [120, 60, "triangle", 0.05];
    oscillator.type = settings[2];
    oscillator.frequency.setValueAtTime(settings[0], now);
    oscillator.frequency.exponentialRampToValueAtTime(settings[1], now + 0.24);
    gain.gain.setValueAtTime(settings[3], now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    oscillator.connect(gain).connect(this.audioContext.destination);
    oscillator.start(now); oscillator.stop(now + 0.3);
  }

  stopRaceAudio(){
    if(this.musicClock) window.clearInterval(this.musicClock);
    this.musicClock = null;
    try { this.engineAudio?.oscillator?.stop(); } catch(error){ /* Already stopped. */ }
    this.engineAudio = null;
    this.audioContext?.close?.();
    this.audioContext = null;
  }

  formatTime(seconds){
    const safe = Math.max(0, Math.ceil(seconds));
    return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
  }

  flashHit(){
    this.flash.setAlpha(0.3);
    this.tweens.add({ targets: this.flash, alpha: 0, duration: 240 });
  }

  showMessage(text, duration = 900){
    this.message.setText(text).setAlpha(1).setScale(0.94);
    this.tweens.killTweensOf(this.message);
    this.tweens.add({ targets: this.message, scale: 1, duration: 120 });
    this.tweens.add({ targets: this.message, alpha: 0, delay: duration, duration: 220 });
  }

  leaveRace(){
    if(this.leavingRace) return;
    this.leavingRace = true;
    this.running = false;
    this.finished = true;
    this.gasHeld = false;
    this.brakeHeld = false;
    this.touchSteer = 0;
    this.stopRaceAudio();
    this.exitRaceButton.setVisible(false);
    const cleanUrl = `${window.location.pathname}${window.location.hash || ""}`;
    window.history.replaceState({}, "", cleanUrl);
    this.showExitTransition();
    try { window.screen?.orientation?.unlock?.(); } catch(error){ /* Optional browser API. */ }
    if(window.screen?.orientation?.lock){
      try {
        const request = window.screen.orientation.lock("portrait");
        request?.catch?.(() => {});
      }catch(error){ /* iOS does not expose orientation lock. */ }
    }
    if(document.fullscreenElement && document.exitFullscreen){
      try {
        const request = document.exitFullscreen();
        request?.catch?.(() => {});
      }catch(error){ /* Continue even if fullscreen cannot be closed. */ }
    }
    this.waitForPortraitThenOpenMap();
  }

  showExitTransition(){
    const W = this.scale.width;
    const H = this.scale.height;
    this.exitTransition = this.add.container(0, 0).setDepth(100);
    const shade = this.add.rectangle(0, 0, W, H, 0x071012, 0.96).setOrigin(0);
    const title = this.add.text(W / 2, H * 0.42, "WRACAMY DO WYPRAWY", {
      fontFamily: "Georgia", fontSize: `${clamp(W * 0.038, 22, 34)}px`, fontStyle: "bold", color: "#f0dfb7"
    }).setOrigin(0.5);
    const body = this.add.text(W / 2, H * 0.54, this.scale.width > this.scale.height
      ? "Obróć telefon pionowo.\nWracamy do wyprawy."
      : "Wracamy do wyprawy.", {
      fontFamily: "Georgia", fontSize: "14px", color: "#c9ad75", align: "center", lineSpacing: 5
    }).setOrigin(0.5);
    this.exitTransition.add([shade, title, body]);
  }

  waitForPortraitThenOpenMap(){
    const coarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches;
    const check = () => {
      if(!this.sys.isActive()) return;
      const portrait = window.innerHeight >= window.innerWidth;
      if(!coarsePointer || portrait){
        this.scale.refresh();
        this.scene.start("MapScene");
        return;
      }
      this.exitPoll = window.setTimeout(check, 180);
    };
    this.exitPoll = window.setTimeout(check, 180);
  }

  endRace(success, title){
    this.finished = true;
    this.running = false;
    this.drive.speedMps = 0;
    this.playRaceSfx(success ? "splash" : "impact");
    this.triggerHeroReaction(success ? "finish" : "shock", 2400);
    const W = this.scale.width;
    const H = this.scale.height;
    const panel = this.add.container(0, 0).setDepth(70);
    const shade = this.add.rectangle(0, 0, W, H, 0x071012, 0.86).setOrigin(0);
    const heading = this.add.text(W / 2, H * 0.3, title, { fontFamily: "Georgia", fontSize: `${clamp(W * 0.042, 24, 38)}px`, fontStyle: "bold", color: success ? "#efd797" : "#df8a62", align: "center", wordWrap: { width: W * 0.76 } }).setOrigin(0.5);
    const result = this.add.text(W / 2, H * 0.44, `${Math.min(FINISH_METERS, this.drive.meters).toFixed(0)} m  ·  ${this.formatTime(this.drive.timeRemaining)}  ·  auto ${Math.round(100 - this.drive.damage)}%`, { fontFamily: "Georgia", fontSize: "14px", color: "#d6c29a" }).setOrigin(0.5);
    const retry = this.makeBriefingButton("JESZCZE RAZ", () => this.scene.restart()).setPosition(W * 0.4, H * 0.66);
    const exit = this.makeBriefingButton(success ? "DALEJ" : "WYJDŹ", () => this.leaveRace()).setPosition(W * 0.68, H * 0.66);
    for(const button of [retry, exit]){
      button.plate.clear().fillStyle(0x183238, 0.96).fillRect(-80, -25, 160, 50).lineStyle(2, 0xc69b58, 0.92).strokeRect(-80, -25, 160, 50);
      button.zone.setSize(160, 50);
    }
    panel.add([shade, heading, result, retry, exit]);
  }

  shutdown(){
    this.stopRaceAudio();
    this.scale.off("resize", this.layout, this);
    this.input.off("pointerup", this.releaseControls, this);
    this.input.off("pointerupoutside", this.releaseControls, this);
    if(this.visibilityHandler) document.removeEventListener("visibilitychange", this.visibilityHandler);
    if(this.orientationHandler) window.removeEventListener("orientationchange", this.orientationHandler);
    if(this.exitPoll) window.clearTimeout(this.exitPoll);
    for(const timer of this.resumeTimers) window.clearTimeout(timer);
    this.visibilityHandler = null;
    this.orientationHandler = null;
  }
}
