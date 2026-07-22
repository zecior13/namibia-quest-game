import { BaseScene } from "./BaseScene.js";
import { HEROES, STAT_LABELS } from "../data/heroes.js";

const CROPS = {
  kira: {
    full: [0, 0, 650, 1024], bust: [590, 155, 570, 560]
  },
  nia: {
    full: [120, 0, 620, 1024], bust: [790, 130, 610, 520]
  },
  bruno: {
    full: [0, 0, 900, 1024], bust: [825, 105, 590, 485]
  },
  celeste: {
    full: [0, 0, 780, 1024], bust: [825, 100, 590, 520]
  },
  tebo: {
    full: [0, 0, 820, 1024], bust: [850, 85, 570, 535]
  },
  mira: {
    full: [0, 0, 680, 1536], bust: [525, 105, 455, 620]
  },
  alex: {
    full: [0, 0, 670, 1536], bust: [515, 95, 460, 630]
  }
};

export class HeroSelectScene extends BaseScene {
  constructor(){
    super("HeroSelectScene");
    this.heroIndex = 0;
    this.selection = [];
  }

  create(){
    this.hero = HEROES[this.heroIndex];
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.closeNameEntry());
    this.addCoverImage("heroGarageSelect");
    this.drawSceneTreatment();
    this.addHeader();
    this.addHeroGrid();
    this.addSelectedHero();
    this.addFooterControls();
  }

  drawSceneTreatment(){
    const shade = this.add.graphics();
    shade.fillStyle(0x0b1419, 0.18);
    shade.fillRect(0, 0, this.W, this.H);
    shade.fillGradientStyle(0x05080b, 0x05080b, 0x05080b, 0x05080b, 0.48, 0.1, 0.05, 0.18);
    shade.fillRect(0, 0, this.W, this.H * 0.16);
    shade.fillGradientStyle(0x05080b, 0x05080b, 0x05080b, 0x05080b, 0.02, 0.42, 0.66, 0.8);
    shade.fillRect(0, this.H * 0.75, this.W, this.H * 0.25);
  }

  addHeader(){
    this.add.text(18, 18, "WYBÓR BOHATERA", {
      fontFamily: "Georgia",
      fontSize: "15px",
      fontStyle: "bold",
      color: "#f0d397",
      letterSpacing: 2,
      shadow: { offsetY: 2, color: "#05080b", blur: 4, fill: true }
    });
    this.add.text(this.W - 18, 18, "7 POSTACI", {
      fontFamily: "Georgia",
      fontSize: "11px",
      fontStyle: "bold",
      color: "#c59b58",
      letterSpacing: 1
    }).setOrigin(1, 0);
  }

  addHeroGrid(){
    const x = 14;
    const gridTop = 98;
    const tileW = Math.min(58, (this.W * 0.46 - 32) / 3);
    const gap = 6;

    HEROES.forEach((hero, index) => {
      const row = index < 3 ? 0 : index < 5 ? 1 : 2;
      const column = index < 3 ? index : index < 5 ? index - 3 : index - 5;
      const tileH = index >= 5 ? 80 : 58;
      const tileX = x + column * (tileW + gap);
      const tileY = row === 0 ? gridTop : row === 1 ? gridTop + 67 : gridTop + 136;
      this.selection[index] = this.addHeroTile(tileX, tileY, tileW, tileH, hero, index);
    });
    this.selectHero(this.heroIndex);
  }

  addHeroTile(x, y, w, h, hero, index){
    const group = this.add.container(x, y);
    const frame = this.add.graphics();
    frame.fillStyle(hero.color, 0.32);
    frame.fillRoundedRect(0, 0, w, h, 7);
    frame.lineStyle(2, 0xb28a50, 0.78);
    frame.strokeRoundedRect(0, 0, w, h, 7);

    const portrait = this.add.image(w / 2, h / 2, `heroPortrait-${hero.id}`);
    portrait.setDisplaySize(w, h);
    const hitArea = this.add.rectangle(w / 2, h / 2, w, h, 0xffffff, 0);
    hitArea.setInteractive({ useHandCursor: true });
    hitArea.on("pointerdown", () => this.selectHero(index));
    group.add([portrait, frame, hitArea]);
    group.setSize(w, h);
    return { group, frame, portrait, hitArea };
  }

  selectHero(index){
    this.heroIndex = index;
    this.hero = HEROES[index];
    this.selection.forEach((item, itemIndex) => {
      item.frame.clear();
      item.frame.fillStyle(HEROES[itemIndex].color, itemIndex === index ? 0.7 : 0.25);
      item.frame.fillRoundedRect(0, 0, item.group.width, item.group.height, 7);
      item.frame.lineStyle(2, itemIndex === index ? 0xf0d397 : 0xb28a50, itemIndex === index ? 1 : 0.72);
      item.frame.strokeRoundedRect(0, 0, item.group.width, item.group.height, 7);
    });
    this.refreshSelectedHero();
  }

  addSelectedHero(){
    this.selectedLayer = this.add.container(0, 0);
    this.refreshSelectedHero();
  }

  refreshSelectedHero(){
    if(!this.selectedLayer) return;
    this.selectedLayer.removeAll(true);
    const hero = this.hero;
    const panelW = this.W * 0.53;
    const fullKey = hero.id === "kira" ? "heroKiraFull" : `heroFull-${hero.id}`;
    const fullSource = this.textures.get(fullKey).getSourceImage();
    const fullHeight = this.H * 0.37;
    const fullWidth = fullHeight * (fullSource.width / fullSource.height);
    const portrait = this.add.image(0, 0, fullKey).setDisplaySize(fullWidth, fullHeight);
    portrait.setPosition(this.W * 0.71, this.H * 0.50);
    this.selectedLayer.add(portrait);

    this.selectedLayer.add(this.add.text(this.W * 0.045, this.H * 0.40, hero.name, {
      fontFamily: "Georgia", fontSize: "14px", fontStyle: "bold", color: "#f4d79b",
      wordWrap: { width: this.W * 0.34 }, shadow: { offsetY: 2, color: "#05080b", blur: 4, fill: true }
    }));
    this.selectedLayer.add(this.add.text(this.W * 0.045, this.H * 0.455, hero.role.toUpperCase(), {
      fontFamily: "Georgia", fontSize: "10px", fontStyle: "bold", color: "#e0af58", letterSpacing: 1,
      wordWrap: { width: this.W * 0.34 }
    }));
    this.selectedLayer.add(this.add.text(this.W * 0.045, this.H * 0.495, hero.note, {
      fontFamily: "Georgia", fontSize: "11px", color: "#f3e2bc", lineSpacing: 1,
      wordWrap: { width: this.W * 0.34 }, shadow: { offsetY: 2, color: "#05080b", blur: 4, fill: true }
    }));

    const stats = Object.keys(STAT_LABELS);
    stats.forEach((stat, index) => {
      const statX = this.W * 0.045 + (index % 2) * (this.W * 0.18);
      const statY = this.H * 0.60 + Math.floor(index / 2) * 18;
      this.selectedLayer.add(this.add.text(statX, statY, `${STAT_LABELS[stat].toUpperCase()} ${hero.stats[stat]}`, {
        fontFamily: "Georgia", fontSize: "11px", fontStyle: "bold", color: "#f0d397"
      }));
    });
    this.selectedLayer.setDepth(3);
  }

  addCroppedHero(hero, kind, width, height){
    const crop = CROPS[hero.id][kind];
    const image = this.add.image(0, 0, `heroSheet-${hero.id}`);
    image.setCrop(crop[0], crop[1], crop[2], crop[3]);
    image.setDisplaySize(width, height);
    return image;
  }

  addFooterControls(){
    this.add.text(14, this.H - 31, "DOTKNIJ PORTRETU, ABY WYBRAĆ", {
      fontFamily: "Georgia", fontSize: "8px", fontStyle: "bold", color: "#d2ad69", letterSpacing: 0.5
    });
    this.addRetroButton(this.W * 0.60, this.H - 65, this.W * 0.34, 38, "WYBIERAM", () => {
      this.openNameEntry();
    });
  }

  openNameEntry(){
    if(this.nameEntry) return;
    const defaultName = this.hero.name.split(" ")[0];
    const overlay = document.createElement("div");
    overlay.className = "hero-name-overlay";

    const panel = document.createElement("section");
    panel.className = "hero-name-panel";
    panel.setAttribute("aria-label", "Nadaj imię bohaterowi");

    const kicker = document.createElement("div");
    kicker.className = "hero-name-kicker";
    kicker.textContent = "KARTA WYPRAWY";
    const title = document.createElement("h2");
    title.textContent = "Jak ma nazywać się bohater?";
    const input = document.createElement("input");
    input.className = "hero-name-input";
    input.type = "text";
    input.maxLength = 18;
    input.value = defaultName;
    input.autocomplete = "off";
    input.spellcheck = false;

    const actions = document.createElement("div");
    actions.className = "hero-name-actions";
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "hero-name-button secondary";
    cancel.textContent = "ANULUJ";
    const confirm = document.createElement("button");
    confirm.type = "button";
    confirm.className = "hero-name-button primary";
    confirm.textContent = "RUSZAJ";

    const submit = () => {
      const name = input.value.trim() || defaultName;
      this.saveGamePatch({
        heroId: this.hero.id,
        heroName: name,
        heroArchetype: this.hero.name,
        stats: this.hero.stats,
        progress: "windhoek"
      });
      this.closeNameEntry();
      this.scene.start("MapScene");
    };
    cancel.addEventListener("click", () => this.closeNameEntry());
    confirm.addEventListener("click", submit);
    input.addEventListener("keydown", (event) => {
      if(event.key === "Enter") submit();
      if(event.key === "Escape") this.closeNameEntry();
    });

    actions.append(cancel, confirm);
    panel.append(kicker, title, input, actions);
    overlay.append(panel);
    document.body.append(overlay);
    this.nameEntry = overlay;
    requestAnimationFrame(() => {
      input.focus();
      input.select();
    });
  }

  closeNameEntry(){
    if(!this.nameEntry) return;
    this.nameEntry.remove();
    this.nameEntry = null;
  }

  addRetroButton(x, y, width, height, label, callback){
    const group = this.add.container(x, y);
    const shadow = this.add.graphics();
    shadow.fillStyle(0x05080b, 0.7);
    shadow.fillRect(3, 4, width, height);
    const plate = this.add.graphics();
    plate.fillStyle(0x9b542d, 1);
    plate.fillRect(0, 0, width, height);
    plate.lineStyle(2, 0xf0d397, 0.92);
    plate.strokeRect(1, 1, width - 2, height - 2);
    const text = this.add.text(width / 2, height / 2, label, {
      fontFamily: "Georgia", fontSize: "13px", fontStyle: "bold", color: "#fff0c2", letterSpacing: 1
    }).setOrigin(0.5);
    const hitArea = this.add.rectangle(width / 2, height / 2, width, height, 0xffffff, 0);
    hitArea.setInteractive({ useHandCursor: true });
    hitArea.on("pointerdown", () => { group.setScale(0.97); callback(); });
    hitArea.on("pointerup", () => group.setScale(1));
    hitArea.on("pointerout", () => group.setScale(1));
    group.add([shadow, plate, text, hitArea]);
  }
}
