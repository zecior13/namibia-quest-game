import { BaseScene } from "./BaseScene.js";

export class StartScene extends BaseScene {
  constructor(){
    super("StartScene");
  }

  create(){
    this.addCoverImage("titleMap");
    this.addDarkVignette();
    this.addTitleTreatment();
    this.addStartHotspots();
  }

  addDarkVignette(){
    const g = this.add.graphics();
    g.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.04, 0.04, 0.72, 0.82);
    g.fillRect(0, 0, this.W, this.H);
    g.fillStyle(0x0b1620, 0.34);
    g.fillRect(0, this.H * 0.72, this.W, this.H * 0.28);
  }

  addTitleTreatment(){
    this.addOverlayText(24, this.H * 0.68, "NAMIBIA QUEST", 15, this.W - 48).setLetterSpacing(3);
    this.addOverlayText(24, this.H * 0.715, "Retro Expedition RPG", 35, this.W - 48);
    this.addOverlayText(
      24,
      this.H * 0.815,
      "Wybierz bohatera i rusz przez Namibię jak przez ręcznie rysowaną przygodę.",
      15,
      this.W - 48
    );
  }

  addStartHotspots(){
    this.addGameButton(24, this.H - 118, this.W - 48, 50, "Rozpocznij grę", () => {
      this.scene.start("HeroSelectScene");
    });

    this.addGameButton(24, this.H - 58, this.W - 48, 42, "Kontynuuj", () => {
      this.scene.start("MapScene");
    }, true);
  }

  addGameButton(x, y, w, h, label, callback, secondary = false){
    const g = this.add.graphics();
    g.fillStyle(secondary ? 0x192c36 : 0x0f879f, secondary ? 0.78 : 0.92);
    g.fillRoundedRect(x, y, w, h, 16);
    g.lineStyle(2, 0xffe1a1, secondary ? 0.16 : 0.28);
    g.strokeRoundedRect(x, y, w, h, 16);

    this.add.text(x + w / 2, y + h / 2, label, {
      fontFamily: "Georgia",
      fontSize: secondary ? "17px" : "20px",
      fontStyle: "bold",
      color: "#fff3d2",
      shadow: { offsetY: 2, color: "#1b120c", blur: 4, fill: true }
    }).setOrigin(0.5);

    this.add.zone(x, y, w, h).setOrigin(0).setInteractive({ useHandCursor: true }).on("pointerdown", callback);
  }
}
