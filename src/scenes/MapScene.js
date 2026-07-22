import { BaseScene } from "./BaseScene.js";
import { HEROES, STAT_LABELS } from "../data/heroes.js";
import { ROUTE, ROUTE_INDEX, ROUTE_LABEL_OFFSETS } from "../data/route.js";

const MAP_SCALE = 1.18;
const MAP_MARGIN = 14;

export class MapScene extends BaseScene {
  constructor(){
    super("MapScene");
    this.markerViews = [];
    this.drag = null;
    this.selectedPoint = null;
  }

  create(){
    this.save = this.getSave();
    this.currentIndex = this.getCurrentIndex();
    this.completedIndex = Math.max(-1, this.currentIndex - 1);
    this.buildWorld();
    this.drawRoute();
    this.drawMarkers();
    this.addExpeditionVehicle();
    this.configureMapCamera();
    this.addHud();
    this.addLocationPanel();
    this.enablePanning();
    this.selectPoint(ROUTE[this.currentIndex], false);
    this.cameras.main.fadeIn(280, 9, 15, 17);
  }

  buildWorld(){
    const source = this.textures.get("campaignMap").getSourceImage();
    this.worldHeight = Math.max(this.H * MAP_SCALE, this.H + 150);
    this.worldWidth = this.worldHeight * (source.width / source.height);
    this.worldWidth = Math.max(this.worldWidth, this.W + 74);

    this.mapArtwork = this.add.image(this.worldWidth / 2, this.worldHeight / 2, "campaignMap")
      .setDisplaySize(this.worldWidth, this.worldHeight)
      .setDepth(0);

    const wash = this.add.graphics().setDepth(1);
    wash.fillGradientStyle(0x071016, 0x071016, 0x071016, 0x071016, 0.16, 0.03, 0.02, 0.24);
    wash.fillRect(0, 0, this.worldWidth, this.worldHeight);
    wash.lineStyle(2, 0x261a10, 0.58);
    wash.strokeRect(3, 3, this.worldWidth - 6, this.worldHeight - 6);
  }

  drawRoute(){
    const routeShadow = this.add.graphics().setDepth(2);
    const routeLine = this.add.graphics().setDepth(3);
    const routeDust = this.add.graphics().setDepth(4);
    const points = ROUTE.map((point) => new Phaser.Math.Vector2(this.mapX(point.x), this.mapY(point.y)));
    const curve = new Phaser.Curves.Spline(points);
    const samples = curve.getSpacedPoints(330);

    routeShadow.lineStyle(6, 0x24170f, 0.32);
    routeLine.lineStyle(2, 0xb58a45, 0.78);
    for(let index = 0; index < samples.length - 1; index++){
      const progress = index / (samples.length - 1);
      if(Math.floor(index / 4) % 2 === 0){
        const a = samples[index];
        const b = samples[index + 1];
        routeShadow.lineBetween(a.x, a.y, b.x, b.y);
        routeLine.lineBetween(a.x, a.y, b.x, b.y);
      }
      if(index % 17 === 0 && progress <= (this.currentIndex + 1) / ROUTE.length){
        routeDust.fillStyle(0xd8b46f, 0.19);
        routeDust.fillCircle(samples[index].x + ((index % 3) - 1) * 2, samples[index].y, 3 + (index % 2));
      }
    }
  }

  drawMarkers(){
    ROUTE.forEach((point, index) => {
      const x = this.mapX(point.x);
      const y = this.mapY(point.y);
      const state = this.getPointState(index);
      const view = this.createMarker(point, index, x, y, state);
      this.markerViews.push(view);
    });
  }

  createMarker(point, index, x, y, state){
    const size = point.kind === "major" ? 12 : point.kind === "road" ? 6 : 9;
    const container = this.add.container(x, y).setDepth(8);
    const shadow = this.add.graphics();
    shadow.fillStyle(0x160f0b, 0.48);
    shadow.fillEllipse(2, 4, size * 2.2, size * 1.1);
    const marker = this.add.graphics();
    this.paintMarker(marker, size, state, false);
    container.add([shadow, marker]);

    const labelOffset = ROUTE_LABEL_OFFSETS[point.id] || [12, 0];
    const revealLabel = state !== "locked" || point.kind === "major";
    let label = null;
    if(revealLabel){
      label = this.add.text(x + labelOffset[0], y + labelOffset[1], state === "locked" ? "···" : point.short, {
        fontFamily: "Georgia",
        fontSize: point.kind === "major" ? "10px" : "8px",
        fontStyle: "bold",
        color: state === "locked" ? "#806f56" : "#f2dfb6",
        stroke: "#21170f",
        strokeThickness: 3,
        shadow: { offsetY: 1, color: "#0a0705", blur: 2, fill: true }
      }).setDepth(9).setAlpha(state === "locked" ? 0.62 : 1);
    }

    const hitRadius = Math.max(20, size + 9);
    const zone = this.add.zone(x, y, hitRadius * 2, hitRadius * 2)
      .setDepth(12)
      .setInteractive({ useHandCursor: state !== "locked" });
    zone.on("pointerup", (pointer) => {
      if(this.drag && this.drag.distance > 9) return;
      this.selectPoint(point, true);
    });

    if(state === "current"){
      this.tweens.add({
        targets: container,
        scale: 1.16,
        duration: 720,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut"
      });
    }

    return { point, index, state, size, container, marker, label, zone };
  }

  paintMarker(graphics, size, state, selected){
    graphics.clear();
    const colors = {
      completed: [0x355c50, 0xe5c87c],
      current: [0xa85f2f, 0xf5db91],
      available: [0x264d58, 0xe3c174],
      locked: [0x4d473c, 0x8a7d64]
    };
    const [fill, line] = colors[state];
    if(selected){
      graphics.lineStyle(3, 0xf4d99a, 0.22);
      graphics.strokeCircle(0, 0, size + 6);
    }
    graphics.fillStyle(fill, state === "locked" ? 0.64 : 0.98);
    graphics.fillCircle(0, 0, size);
    graphics.lineStyle(selected ? 3 : 2, line, state === "locked" ? 0.55 : 0.94);
    graphics.strokeCircle(0, 0, size);
    if(state === "completed"){
      graphics.lineStyle(2, 0xf1d58e, 0.88);
      graphics.lineBetween(-4, 0, -1, 4);
      graphics.lineBetween(-1, 4, 5, -4);
    }else if(state === "locked"){
      graphics.fillStyle(0xb5a783, 0.62);
      graphics.fillCircle(0, 0, 2);
    }else{
      graphics.fillStyle(0xf5dfaa, 0.94);
      graphics.fillCircle(0, 0, Math.max(2, size * 0.27));
    }
  }

  addExpeditionVehicle(){
    const point = ROUTE[this.currentIndex];
    const vehicle = this.add.image(this.mapX(point.x) - 21, this.mapY(point.y) + 20, "startVehicleClean")
      .setDisplaySize(47, 31)
      .setDepth(10)
      .setOrigin(0.5, 0.72);
    this.tweens.add({
      targets: vehicle,
      y: vehicle.y - 1.5,
      duration: 150,
      yoyo: true,
      repeat: -1,
      hold: 80,
      repeatDelay: 120,
      ease: "Quad.easeOut"
    });
  }

  configureMapCamera(){
    this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);
    const current = ROUTE[this.currentIndex];
    const focusX = Phaser.Math.Clamp(this.mapX(current.x) - this.W / 2, 0, Math.max(0, this.worldWidth - this.W));
    const focusY = Phaser.Math.Clamp(this.mapY(current.y) - this.H * 0.52, 0, Math.max(0, this.worldHeight - this.H));
    this.cameras.main.setScroll(focusX, focusY);
  }

  enablePanning(){
    this.input.on("pointerdown", (pointer) => {
      if(pointer.y < 78 || pointer.y > this.H - 104) return;
      this.drag = {
        x: pointer.x,
        y: pointer.y,
        scrollX: this.cameras.main.scrollX,
        scrollY: this.cameras.main.scrollY,
        distance: 0
      };
    });
    this.input.on("pointermove", (pointer) => {
      if(!pointer.isDown || !this.drag) return;
      const dx = pointer.x - this.drag.x;
      const dy = pointer.y - this.drag.y;
      this.drag.distance = Math.max(this.drag.distance, Math.hypot(dx, dy));
      this.cameras.main.setScroll(this.drag.scrollX - dx, this.drag.scrollY - dy);
    });
    this.input.on("pointerup", () => {
      this.time.delayedCall(40, () => { this.drag = null; });
    });
  }

  addHud(){
    const hero = HEROES.find((entry) => entry.id === this.save.heroId) || HEROES[0];
    const topShade = this.add.graphics().setScrollFactor(0).setDepth(30);
    topShade.fillGradientStyle(0x071016, 0x071016, 0x071016, 0x071016, 0.78, 0.68, 0.04, 0.0);
    topShade.fillRect(0, 0, this.W, 98);

    const portrait = this.add.image(42, 40, `heroPortrait-${hero.id}`)
      .setDisplaySize(48, 48)
      .setScrollFactor(0)
      .setDepth(33)
      .setInteractive({ useHandCursor: true });
    const portraitFrame = this.add.graphics().setScrollFactor(0).setDepth(34);
    portraitFrame.lineStyle(2, 0xe0bd72, 0.92);
    portraitFrame.strokeRect(17, 15, 50, 50);
    portraitFrame.lineStyle(1, hero.color, 0.9);
    portraitFrame.strokeRect(20, 18, 44, 44);
    portrait.on("pointerdown", () => this.toggleHeroCard(hero));

    this.add.text(77, 18, this.save.heroName || hero.name.split(" ")[0], {
      fontFamily: "Georgia", fontSize: "13px", fontStyle: "bold", color: "#f4dfb2",
      shadow: { offsetY: 2, color: "#0a0705", blur: 3, fill: true }
    }).setScrollFactor(0).setDepth(33);
    this.add.text(77, 39, "ETAP 1 · WINDHOEK", {
      fontFamily: "Georgia", fontSize: "9px", fontStyle: "bold", color: "#c59a55", letterSpacing: 1
    }).setScrollFactor(0).setDepth(33);

    this.addTextButton(this.W - 125, 20, 72, 34, "SPRZĘT", () => this.toggleGearCard(), 32);
    this.addSettingsControl(this.W - 29, 37);
  }

  addTextButton(x, y, width, height, label, callback, depth){
    const group = this.add.container(x, y).setScrollFactor(0).setDepth(depth);
    const plate = this.add.graphics();
    plate.fillStyle(0x132a32, 0.9);
    plate.fillRect(0, 0, width, height);
    plate.lineStyle(1, 0xb99354, 0.84);
    plate.strokeRect(0, 0, width, height);
    const text = this.add.text(width / 2, height / 2, label, {
      fontFamily: "Georgia", fontSize: "9px", fontStyle: "bold", color: "#ead09a", letterSpacing: 1
    }).setOrigin(0.5);
    group.add([plate, text]);
    group.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);
    group.input.cursor = "pointer";
    group.on("pointerdown", callback);
    return group;
  }

  addSettingsControl(x, y){
    const group = this.add.container(x, y).setScrollFactor(0).setDepth(34);
    const g = this.add.graphics();
    g.fillStyle(0x132a32, 0.92);
    g.fillCircle(0, 0, 17);
    g.lineStyle(2, 0xd7b66d, 0.88);
    g.strokeCircle(0, 0, 16);
    g.strokeCircle(0, 0, 5);
    for(let index = 0; index < 8; index++){
      const angle = (Math.PI * 2 * index) / 8;
      g.lineBetween(Math.cos(angle) * 9, Math.sin(angle) * 9, Math.cos(angle) * 12, Math.sin(angle) * 12);
    }
    group.add(g);
    group.setInteractive(new Phaser.Geom.Circle(0, 0, 19), Phaser.Geom.Circle.Contains);
    group.input.cursor = "pointer";
    group.on("pointerdown", () => this.toggleSettingsCard());
  }

  addLocationPanel(){
    this.locationLayer = this.add.container(0, 0).setScrollFactor(0).setDepth(40);
  }

  selectPoint(point, moveCamera){
    const index = ROUTE_INDEX[point.id];
    const state = this.getPointState(index);
    this.selectedPoint = point;
    this.markerViews.forEach((view) => this.paintMarker(view.marker, view.size, view.state, view.point.id === point.id));
    this.renderLocationPanel(point, state, index);
    if(moveCamera){
      const targetX = Phaser.Math.Clamp(this.mapX(point.x) - this.W / 2, 0, Math.max(0, this.worldWidth - this.W));
      const targetY = Phaser.Math.Clamp(this.mapY(point.y) - this.H * 0.50, 0, Math.max(0, this.worldHeight - this.H));
      this.cameras.main.pan(targetX + this.W / 2, targetY + this.H / 2, 420, "Sine.easeInOut");
    }
  }

  renderLocationPanel(point, state, index){
    this.locationLayer.removeAll(true);
    const y = this.H - 92;
    const shade = this.add.graphics();
    shade.fillGradientStyle(0x071016, 0x071016, 0x071016, 0x071016, 0.04, 0.42, 0.82, 0.92);
    shade.fillRect(0, y - 35, this.W, 127);
    this.locationLayer.add(shade);

    const visibleName = state === "locked" ? "NIEZNANY ETAP" : point.name.toUpperCase();
    const descriptions = {
      current: "Ostatnie przygotowania przed drogą na południe.",
      available: point.scene ? "Droga jest otwarta." : "Najpierw ukończ bieżący etap wyprawy.",
      completed: "Etap ukończony. Możesz wrócić do próby.",
      locked: "Szlak odsłoni tę część mapy później."
    };
    this.locationLayer.add(this.add.text(20, y - 8, visibleName, {
      fontFamily: "Georgia", fontSize: "14px", fontStyle: "bold", color: state === "locked" ? "#a4977b" : "#f3ddb0",
      shadow: { offsetY: 2, color: "#090604", blur: 3, fill: true }
    }));
    this.locationLayer.add(this.add.text(20, y + 17, descriptions[state], {
      fontFamily: "Georgia", fontSize: "10px", color: "#d8c59e", wordWrap: { width: this.W - 142 }
    }));

    if(state !== "locked" && point.scene){
      const action = this.addTextButton(this.W - 108, y - 8, 90, 42, state === "current" ? "RUSZAJ" : "WEJDŹ", () => {
        if(point.scene) this.scene.start(point.scene);
      }, 1);
      action.setScrollFactor(0);
      this.locationLayer.add(action);
    }
  }

  toggleHeroCard(hero){
    if(this.popupType === "hero"){
      this.closePopup();
      return;
    }
    this.closePopup();
    this.popupType = "hero";
    const card = this.createPopup(18, 86, 205, 154);
    card.add(this.add.text(14, 12, hero.name, { fontFamily: "Georgia", fontSize: "13px", fontStyle: "bold", color: "#f1d79e", wordWrap: { width: 177 } }));
    card.add(this.add.text(14, 48, hero.role.toUpperCase(), { fontFamily: "Georgia", fontSize: "8px", fontStyle: "bold", color: "#c6954d", letterSpacing: 1 }));
    Object.entries(STAT_LABELS).forEach(([key, label], index) => {
      card.add(this.add.text(14 + (index % 2) * 92, 79 + Math.floor(index / 2) * 28, `${label.toUpperCase()} ${hero.stats[key]}`, {
        fontFamily: "Georgia", fontSize: "10px", fontStyle: "bold", color: "#ead9b7"
      }));
    });
  }

  toggleGearCard(){
    if(this.popupType === "gear"){
      this.closePopup();
      return;
    }
    this.closePopup();
    this.popupType = "gear";
    const card = this.createPopup(this.W - 224, 63, 206, 132);
    card.add(this.add.text(14, 12, "EKWIPUNEK", { fontFamily: "Georgia", fontSize: "13px", fontStyle: "bold", color: "#f1d79e", letterSpacing: 1 }));
    card.add(this.add.text(14, 44, "Samochód czeka na spakowanie.\nSprzęt wybierzesz w Windhoek.", {
      fontFamily: "Georgia", fontSize: "10px", color: "#dac8a5", lineSpacing: 4, wordWrap: { width: 176 }
    }));
  }

  toggleSettingsCard(){
    if(this.popupType === "settings"){
      this.closePopup();
      return;
    }
    this.closePopup();
    this.popupType = "settings";
    const card = this.createPopup(this.W - 224, 63, 206, 146);
    card.add(this.add.text(14, 12, "USTAWIENIA", { fontFamily: "Georgia", fontSize: "13px", fontStyle: "bold", color: "#f1d79e", letterSpacing: 1 }));
    const music = this.getSave().music !== false ? "WŁ." : "WYŁ.";
    const sfx = this.getSave().sfx !== false ? "WŁ." : "WYŁ.";
    this.addPopupAction(card, 14, 46, `MUZYKA  ${music}`, () => {
      this.saveGamePatch({ music: this.getSave().music === false });
      this.closePopup();
      this.toggleSettingsCard();
    });
    this.addPopupAction(card, 14, 88, `DŹWIĘKI  ${sfx}`, () => {
      this.saveGamePatch({ sfx: this.getSave().sfx === false });
      this.closePopup();
      this.toggleSettingsCard();
    });
  }

  createPopup(x, y, width, height){
    const card = this.add.container(x, y).setScrollFactor(0).setDepth(60);
    const bg = this.add.graphics();
    bg.fillStyle(0x13252b, 0.97);
    bg.fillRect(0, 0, width, height);
    bg.lineStyle(2, 0xbe9653, 0.92);
    bg.strokeRect(1, 1, width - 2, height - 2);
    card.add(bg);
    this.popup = card;
    return card;
  }

  addPopupAction(card, x, y, label, callback){
    const width = 178;
    const height = 30;
    const plate = this.add.graphics();
    plate.fillStyle(0x243c40, 0.78);
    plate.fillRect(x, y - 7, width, height);
    plate.lineStyle(1, 0x9b7a45, 0.65);
    plate.strokeRect(x, y - 7, width, height);
    const text = this.add.text(x + 10, y - 7 + height / 2, label, {
      fontFamily: "Georgia", fontSize: "10px", fontStyle: "bold", color: "#e8d2a3"
    }).setOrigin(0, 0.5);
    const hitArea = this.add.zone(card.x + x, card.y + y - 7, width, height)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(61)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", callback);
    card.add([plate, text]);
    this.popupHitAreas = this.popupHitAreas || [];
    this.popupHitAreas.push(hitArea);
  }

  closePopup(){
    if(this.popup){
      this.popup.destroy(true);
      this.popup = null;
    }
    if(this.popupHitAreas){
      this.popupHitAreas.forEach((hitArea) => hitArea.destroy());
      this.popupHitAreas = [];
    }
    this.popupType = null;
  }

  getCurrentIndex(){
    const progressId = this.save.mapStage || this.save.progress || "windhoek";
    return ROUTE_INDEX[progressId] ?? 0;
  }

  getPointState(index){
    if(index <= this.completedIndex) return "completed";
    if(index === this.currentIndex) return "current";
    if(index === this.currentIndex + 1) return "available";
    return "locked";
  }

  mapX(percent){
    return MAP_MARGIN + (this.worldWidth - MAP_MARGIN * 2) * (percent / 100);
  }

  mapY(percent){
    return MAP_MARGIN + (this.worldHeight - MAP_MARGIN * 2) * (percent / 100);
  }
}
