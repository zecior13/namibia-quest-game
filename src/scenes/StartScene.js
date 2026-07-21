import { BaseScene } from "./BaseScene.js";

export class StartScene extends BaseScene {
  constructor(){
    super("StartScene");
  }

  create(){
    this.addCoverImage("titleMap");
    this.addDarkVignette();
    this.addTitleTreatment();
    this.addStartMenu();
  }

  addDarkVignette(){
    const g = this.add.graphics();
    g.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.02, 0.02, 0.42, 0.72);
    g.fillRect(0, 0, this.W, this.H);
    g.fillStyle(0x071016, 0.46);
    g.fillRect(0, this.H * 0.70, this.W, this.H * 0.30);
  }

  addTitleTreatment(){
    this.addOverlayText(24, this.H * 0.675, "NAMIBIA QUEST", 15, this.W - 48).setLetterSpacing(3);
    this.addOverlayText(24, this.H * 0.725, "Namibia Quest", 39, this.W - 48);
    this.addOverlayText(
      24,
      this.H * 0.815,
      "Wybierz bohatera i rusz przez Namibię jak przez ręcznie rysowaną wyprawę.",
      15,
      this.W - 48
    );
  }

  addStartMenu(){
    const y = this.H - 82;
    this.addMenuItem(28, y, "NOWA WYPRAWA", () => this.scene.start("HeroSelectScene"));
    this.addMenuItem(222, y, "WCZYTAJ", () => this.scene.start("MapScene"), true);
  }

  addMenuItem(x, y, label, callback, secondary = false){
    const color = secondary ? "#d6b982" : "#fff0c2";
    const activeColor = secondary ? "#fff0c2" : "#ffffff";
    const prefix = secondary ? "" : "▸ ";
    const text = this.add.text(x, y, `${prefix}${label}`, {
      fontFamily: "Georgia",
      fontSize: secondary ? "16px" : "18px",
      fontStyle: "bold",
      color,
      shadow: { offsetY: 2, color: "#05090d", blur: 5, fill: true }
    }).setOrigin(0, 0.5);

    const bounds = text.getBounds();
    const zone = this.add.zone(bounds.x - 8, y - 20, bounds.width + 16, 40)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => text.setColor(activeColor))
      .on("pointerout", () => text.setColor(color))
      .on("pointerdown", callback);

    return zone;
  }
}
