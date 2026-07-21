import { BaseScene } from "./BaseScene.js";
import { HEROES, STAT_LABELS } from "../data/heroes.js";

const CROPS = {
  kira: {
    full: [0, 0, 650, 1024], bust: [555, 35, 720, 720]
  },
  nia: {
    full: [120, 0, 620, 1024], bust: [700, 35, 760, 660]
  },
  bruno: {
    full: [0, 0, 900, 1024], bust: [770, 20, 700, 590]
  },
  celeste: {
    full: [0, 0, 780, 1024], bust: [775, 15, 720, 620]
  },
  tebo: {
    full: [0, 0, 820, 1024], bust: [790, 25, 720, 630]
  },
  mira: {
    full: [0, 0, 680, 1536], bust: [495, 65, 520, 720]
  },
  alex: {
    full: [0, 0, 670, 1536], bust: [485, 55, 530, 720]
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
    this.addCoverImage("heroSelectStyle");
    this.drawSceneTreatment();
    this.addHeader();
    this.addHeroGrid();
    this.addSelectedHero();
    this.addFooterControls();
  }

  drawSceneTreatment(){
    const shade = this.add.graphics();
    shade.fillStyle(0x0b1419, 0.66);
    shade.fillRect(0, 0, this.W, this.H);

    const left = this.add.graphics();
    left.fillStyle(0x091219, 0.78);
    left.fillRoundedRect(10, 74, this.W * 0.38, this.H - 144, 10);
    left.lineStyle(2, 0xd4a35e, 0.7);
    left.strokeRoundedRect(10, 74, this.W * 0.38, this.H - 144, 10);

    const right = this.add.graphics();
    right.fillStyle(0x24170f, 0.74);
    right.fillRoundedRect(this.W * 0.41, 74, this.W * 0.57, this.H - 144, 10);
    right.lineStyle(2, 0xd4a35e, 0.72);
    right.strokeRoundedRect(this.W * 0.41, 74, this.W * 0.57, this.H - 144, 10);
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
    const x = 17;
    const gridTop = 94;
    const tileW = (this.W * 0.38 - 28) / 3;
    const tileH = 92;
    const gap = 4;

    HEROES.forEach((hero, index) => {
      const row = index < 3 ? 0 : 1;
      const column = index < 3 ? index : index - 3;
      const tileX = x + column * (tileW + gap);
      const tileY = gridTop + row * (tileH + 7);
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

    const portrait = this.addCroppedHero(hero, "bust", w * 0.92, h * 0.82);
    portrait.setPosition(w / 2, h * 0.45);
    group.add([frame, portrait]);
    group.setSize(w, h);
    group.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains);
    group.on("pointerdown", () => this.selectHero(index));
    return { group, frame, portrait };
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
    const panelX = this.W * 0.43;
    const panelW = this.W * 0.53;
    const portrait = this.addCroppedHero(hero, "full", panelW * 0.84, this.H * 0.47);
    portrait.setPosition(panelX + panelW / 2, this.H * 0.335);
    this.selectedLayer.add(portrait);

    this.selectedLayer.add(this.add.text(panelX + 12, this.H * 0.585, hero.name, {
      fontFamily: "Georgia", fontSize: "18px", fontStyle: "bold", color: "#f4d79b",
      wordWrap: { width: panelW - 24 }, shadow: { offsetY: 2, color: "#05080b", blur: 4, fill: true }
    }));
    this.selectedLayer.add(this.add.text(panelX + 12, this.H * 0.64, hero.role.toUpperCase(), {
      fontFamily: "Georgia", fontSize: "10px", fontStyle: "bold", color: "#e0af58", letterSpacing: 1,
      wordWrap: { width: panelW - 24 }
    }));
    this.selectedLayer.add(this.add.text(panelX + 12, this.H * 0.685, hero.note, {
      fontFamily: "Georgia", fontSize: "12px", color: "#f3e2bc", lineSpacing: 2,
      wordWrap: { width: panelW - 24 }
    }));

    const stats = Object.keys(STAT_LABELS);
    stats.forEach((stat, index) => {
      const statX = panelX + 12 + (index % 2) * (panelW * 0.47);
      const statY = this.H * 0.77 + Math.floor(index / 2) * 28;
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
    this.add.text(18, this.H - 58, "DOTKNIJ POSTACI, ABY JĄ WYBRAĆ", {
      fontFamily: "Georgia", fontSize: "10px", fontStyle: "bold", color: "#d2ad69", letterSpacing: 1
    });
    this.addRetroButton(this.W * 0.57, this.H - 65, this.W * 0.37, 38, "WYBIERAM", () => {
      const name = window.prompt("Jak ma nazywać się bohater?", this.hero.name.split(" ")[0]);
      this.saveGamePatch({
        heroId: this.hero.id,
        heroName: name && name.trim() ? name.trim() : this.hero.name.split(" ")[0],
        heroArchetype: this.hero.name,
        stats: this.hero.stats,
        progress: "windhoek"
      });
      this.scene.start("MapScene");
    });
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
    group.add([shadow, plate, text]);
    group.setSize(width, height);
    group.setInteractive({ useHandCursor: true });
    group.on("pointerdown", () => { group.setScale(0.97); callback(); });
    group.on("pointerup", () => group.setScale(1));
    group.on("pointerout", () => group.setScale(1));
  }
}
