import { BaseScene } from "./BaseScene.js";

export class StartScene extends BaseScene {
  constructor(){
    super("StartScene");
    this.settingsLayer = null;
  }

  create(){
    this.addCoverImage("startScene");
    this.addTitleTreatment();
    this.addAmbientMotion();
    this.addStartControls();
    this.addSettingsButton();
  }

  addTitleTreatment(){
    const topShade = this.add.graphics();
    topShade.fillGradientStyle(0x071016, 0x071016, 0x071016, 0x071016, 0.56, 0.16, 0.02, 0.02);
    topShade.fillRect(0, 0, this.W, this.H * 0.24);

    this.add.text(22, 26, "NAMIBIA QUEST", {
      fontFamily: "Georgia",
      fontSize: "15px",
      fontStyle: "bold",
      color: "#f4e5bb",
      letterSpacing: 3,
      shadow: { offsetY: 2, color: "#17100b", blur: 4, fill: true }
    });

    this.add.text(22, 54, "Wyprawa zaczyna się tutaj", {
      fontFamily: "Georgia",
      fontSize: "27px",
      fontStyle: "bold",
      color: "#fff2cf",
      lineSpacing: -4,
      shadow: { offsetY: 3, color: "#17100b", blur: 7, fill: true },
      wordWrap: { width: this.W - 44 }
    });
  }

  addAmbientMotion(){
    const dust = this.add.graphics();
    dust.fillStyle(0xe8c58b, 0.32);
    [
      [this.W * 0.67, this.H * 0.76, 2],
      [this.W * 0.74, this.H * 0.80, 1.5],
      [this.W * 0.82, this.H * 0.73, 2],
      [this.W * 0.58, this.H * 0.84, 1]
    ].forEach(([x, y, radius]) => dust.fillCircle(x, y, radius));

    this.tweens.add({
      targets: dust,
      alpha: 0.16,
      duration: 2600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
  }

  addStartControls(){
    const bottomShade = this.add.graphics();
    bottomShade.fillGradientStyle(0x071016, 0x071016, 0x071016, 0x071016, 0.02, 0.16, 0.82, 0.94);
    bottomShade.fillRect(0, this.H * 0.78, this.W, this.H * 0.22);

    this.addRetroButton(22, this.H - 112, this.W - 44, 42, "NOWA WYPRAWA", () => {
      this.scene.start("HeroSelectScene");
    });
    this.addRetroButton(22, this.H - 62, this.W - 44, 34, "KONTYNUUJ", () => {
      this.scene.start("MapScene");
    }, true);
  }

  addRetroButton(x, y, width, height, label, callback, secondary = false){
    const group = this.add.container(x, y);
    const shadow = this.add.graphics();
    shadow.fillStyle(0x120d09, 0.62);
    shadow.fillRect(3, 4, width, height);

    const plate = this.add.graphics();
    plate.fillStyle(secondary ? 0x1d3540 : 0x9f5f2d, 0.98);
    plate.fillRect(0, 0, width, height);
    plate.lineStyle(2, secondary ? 0xc8a866 : 0xf2d18c, 0.9);
    plate.strokeRect(1, 1, width - 2, height - 2);
    plate.lineStyle(1, 0x17100b, 0.9);
    plate.strokeRect(5, 5, width - 10, height - 10);

    const text = this.add.text(width / 2, height / 2 - 1, label, {
      fontFamily: "Georgia",
      fontSize: secondary ? "14px" : "16px",
      fontStyle: "bold",
      color: "#fff2cf",
      letterSpacing: 1,
      shadow: { offsetY: 2, color: "#110b07", blur: 3, fill: true }
    }).setOrigin(0.5);

    group.add([shadow, plate, text]);
    group.setSize(width, height);
    group.setInteractive({ useHandCursor: true });
    group.on("pointerover", () => {
      plate.setAlpha(0.82);
      text.setColor("#ffffff");
    });
    group.on("pointerout", () => {
      plate.setAlpha(1);
      text.setColor("#fff2cf");
    });
    group.on("pointerdown", () => {
      group.setScale(0.98);
      callback();
    });
    group.on("pointerup", () => group.setScale(1));
    return group;
  }

  addSettingsButton(){
    const x = this.W - 38;
    const y = 34;
    const group = this.add.container(x, y);
    const g = this.add.graphics();
    g.fillStyle(0x1d3540, 0.88);
    g.fillCircle(0, 0, 15);
    g.lineStyle(2, 0xe4c47f, 0.8);
    g.strokeCircle(0, 0, 15);
    g.lineStyle(2, 0xf3ddb0, 0.9);
    g.strokeCircle(0, 0, 5);
    for(let i = 0; i < 8; i++){
      const angle = (Math.PI * 2 * i) / 8;
      g.lineBetween(Math.cos(angle) * 8, Math.sin(angle) * 8, Math.cos(angle) * 11, Math.sin(angle) * 11);
    }
    group.add(g);
    group.setSize(34, 34);
    group.setInteractive({ useHandCursor: true }).on("pointerdown", () => this.toggleSettings());
  }

  toggleSettings(){
    if(this.settingsLayer){
      this.settingsLayer.destroy(true);
      this.settingsLayer = null;
      return;
    }

    const saved = this.getSave();
    const layer = this.add.container(0, 0);
    const shade = this.add.graphics();
    shade.fillStyle(0x071016, 0.74);
    shade.fillRect(0, 0, this.W, this.H);

    const panel = this.add.graphics();
    panel.fillStyle(0x1d3540, 0.98);
    panel.fillRect(24, 170, this.W - 48, 360);
    panel.lineStyle(2, 0xd4ad63, 0.9);
    panel.strokeRect(26, 172, this.W - 52, 356);
    panel.lineStyle(1, 0x0c171d, 0.9);
    panel.strokeRect(32, 178, this.W - 64, 344);

    const title = this.add.text(this.W / 2, 204, "USTAWIENIA WYPRAWY", {
      fontFamily: "Georgia",
      fontSize: "18px",
      fontStyle: "bold",
      color: "#f5dfaa",
      letterSpacing: 1
    }).setOrigin(0.5);
    layer.add([shade, panel, title]);

    const rows = [
      ["MUZYKA", saved.music !== false],
      ["EFEKTY DŹWIĘKOWE", saved.sfx !== false],
      ["WIBRACJE", saved.vibration !== false],
      ["JĘZYK", "POLSKI"]
    ];
    rows.forEach(([label, value], index) => {
      const y = 260 + index * 52;
      const row = this.add.text(52, y, label, {
        fontFamily: "Georgia",
        fontSize: "13px",
        fontStyle: "bold",
        color: "#f3e7c9"
      });
      const valueText = this.add.text(this.W - 52, y, typeof value === "boolean" ? (value ? "WŁ." : "WYŁ.") : value, {
        fontFamily: "Georgia",
        fontSize: "13px",
        fontStyle: "bold",
        color: typeof value === "boolean" ? "#d9b35f" : "#b9d4c7"
      }).setOrigin(1, 0);
      layer.add([row, valueText]);
      if(typeof value === "boolean"){
        valueText.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
          const key = ["music", "sfx", "vibration"][index];
          const next = !(this.getSave()[key] !== false);
          this.saveGamePatch({ [key]: next });
          valueText.setText(next ? "WŁ." : "WYŁ.");
        });
      }
    });

    const close = this.add.text(this.W / 2, 480, "ZAMKNIJ", {
      fontFamily: "Georgia",
      fontSize: "15px",
      fontStyle: "bold",
      color: "#f5dfaa",
      letterSpacing: 1
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    close.on("pointerdown", () => this.toggleSettings());
    layer.add(close);
    this.settingsLayer = layer;
  }
}
