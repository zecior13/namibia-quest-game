import { BaseScene } from "./BaseScene.js";
import { HEROES, STAT_LABELS } from "../data/heroes.js";

export class HeroSelectScene extends BaseScene {
  constructor(){
    super("HeroSelectScene");
    this.heroIndex = 0;
  }

  create(){
    this.hero = HEROES[this.heroIndex] || HEROES[0];
    this.addCoverImage("heroDriver");
    this.addShade();
    this.addHeader();
    this.addHeroCaption();
    this.addControls();
  }

  addShade(){
    const g = this.add.graphics();
    g.fillGradientStyle(0x05080b, 0x05080b, 0x05080b, 0x05080b, 0.08, 0.08, 0.18, 0.72);
    g.fillRect(0, 0, this.W, this.H);
    g.fillStyle(0x05080b, 0.54);
    g.fillRect(0, this.H * 0.70, this.W, this.H * 0.30);
  }

  addHeader(){
    this.addOverlayText(22, 24, "WYBÓR BOHATERA", 14, this.W - 44).setLetterSpacing(2);
    this.addOverlayText(22, 50, "Kapitan 4x4", 29, this.W - 44);
  }

  addHeroCaption(){
    const hero = HEROES[0];
    this.add.text(22, this.H * 0.715, hero.name, {
      fontFamily: "Georgia",
      fontSize: "28px",
      fontStyle: "bold",
      color: "#fff0c2",
      shadow: { offsetY: 3, color: "#05080b", blur: 7, fill: true }
    });

    this.add.text(22, this.H * 0.755, hero.role.toUpperCase(), {
      fontFamily: "Georgia",
      fontSize: "12px",
      fontStyle: "bold",
      color: "#cfa75f",
      letterSpacing: 2,
      shadow: { offsetY: 2, color: "#05080b", blur: 5, fill: true }
    });

    this.add.text(22, this.H * 0.785, hero.note, {
      fontFamily: "Georgia",
      fontSize: "14px",
      fontStyle: "bold",
      color: "#f2dfb3",
      lineSpacing: 3,
      wordWrap: { width: this.W - 44 },
      shadow: { offsetY: 2, color: "#05080b", blur: 5, fill: true }
    });

    this.drawStats(hero);
  }

  drawStats(hero){
    const stats = Object.keys(STAT_LABELS);
    stats.forEach((stat, index)=>{
      const x = 24 + index * 88;
      const y = this.H - 112;
      this.add.text(x, y, STAT_LABELS[stat].toUpperCase(), {
        fontFamily: "Georgia",
        fontSize: "9px",
        fontStyle: "bold",
        color: "#b89555",
        shadow: { offsetY: 2, color: "#05080b", blur: 4, fill: true }
      });
      this.add.text(x, y + 14, `${hero.stats[stat]}`, {
        fontFamily: "Georgia",
        fontSize: "19px",
        fontStyle: "bold",
        color: "#fff0c2",
        shadow: { offsetY: 2, color: "#05080b", blur: 4, fill: true }
      });
    });
  }

  addControls(){
    this.addMenuItem(24, this.H - 48, "WRÓĆ", () => this.scene.start("StartScene"), true);
    this.addMenuItem(this.W - 154, this.H - 48, "WYBIERZ", () => {
      const hero = HEROES[0];
      this.saveGamePatch({ heroId: hero.id, heroName: "Bohater", heroArchetype: hero.name, stats: hero.stats, progress: "windhoek" });
      this.scene.start("MapScene");
    });

    this.add.text(this.W / 2, this.H - 49, "1 / 6", {
      fontFamily: "Georgia",
      fontSize: "13px",
      fontStyle: "bold",
      color: "#b89555",
      shadow: { offsetY: 2, color: "#05080b", blur: 4, fill: true }
    }).setOrigin(0.5);
  }

  addMenuItem(x, y, label, callback, secondary = false){
    const color = secondary ? "#d4b77b" : "#fff0c2";
    const hover = "#ffffff";
    const text = this.add.text(x, y, label, {
      fontFamily: "Georgia",
      fontSize: "16px",
      fontStyle: "bold",
      color,
      shadow: { offsetY: 2, color: "#05080b", blur: 5, fill: true }
    }).setOrigin(0, 0.5);

    const bounds = text.getBounds();
    this.add.zone(bounds.x - 10, y - 20, bounds.width + 20, 40)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => text.setColor(hover))
      .on("pointerout", () => text.setColor(color))
      .on("pointerdown", callback);
  }
}
