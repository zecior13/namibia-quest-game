import { BaseScene } from "./BaseScene.js";

export class StartScene extends BaseScene {
  constructor(){
    super("StartScene");
    this.settingsLayer = null;
  }

  create(){
    this.sceneImage = this.addCoverImage("startScene");
    this.addTitleTreatment();
    this.addAmbientMotion();
    this.addStartControls();
    this.addSettingsButton();
    this.input.once("pointerdown", () => this.startAmbientSound());
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
    this.tweens.add({
      targets: this.sceneImage,
      y: this.H / 2 - 1.5,
      angle: 0.08,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    const dust = this.add.graphics();
    dust.fillStyle(0xe8c58b, 0.42);
    const dustMotes = [
      { x: this.W * 0.66, y: this.H * 0.76, r: 2.5, dx: 34, dy: -7, duration: 4200 },
      { x: this.W * 0.73, y: this.H * 0.80, r: 1.8, dx: 26, dy: -4, duration: 3300 },
      { x: this.W * 0.82, y: this.H * 0.73, r: 2.2, dx: 42, dy: -9, duration: 5100 },
      { x: this.W * 0.58, y: this.H * 0.84, r: 1.4, dx: 22, dy: -3, duration: 2900 }
    ];
    dustMotes.forEach((mote, index) => {
      const moteGraphic = this.add.graphics();
      moteGraphic.fillStyle(0xe8c58b, 0.42);
      moteGraphic.fillCircle(0, 0, mote.r);
      moteGraphic.x = mote.x;
      moteGraphic.y = mote.y;
      this.tweens.add({
        targets: moteGraphic,
        x: mote.x + mote.dx,
        y: mote.y + mote.dy,
        alpha: 0.05,
        duration: mote.duration,
        delay: index * 480,
        repeat: -1,
        yoyo: true,
        ease: "Sine.easeInOut"
      });
    });

    const bird = this.add.graphics();
    bird.lineStyle(2, 0x35251c, 0.82);
    bird.beginPath();
    bird.moveTo(-9, 2);
    bird.lineTo(-4, -3);
    bird.lineTo(0, 0);
    bird.lineTo(4, -3);
    bird.lineTo(9, 2);
    bird.strokePath();
    bird.x = this.W * 0.82;
    bird.y = this.H * 0.20;
    this.tweens.add({
      targets: bird,
      x: this.W * 0.25,
      y: this.H * 0.27,
      angle: -8,
      duration: 12000,
      delay: 3200,
      repeat: -1,
      yoyo: true,
      ease: "Sine.easeInOut"
    });
  }

  addStartControls(){
    const bottomShade = this.add.graphics();
    bottomShade.fillGradientStyle(0x071016, 0x071016, 0x071016, 0x071016, 0.00, 0.05, 0.36, 0.68);
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
    group.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, width, height),
      Phaser.Geom.Rectangle.Contains,
      { useHandCursor: true }
    );
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
      this.playUiSound();
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
    group.setInteractive(
      new Phaser.Geom.Rectangle(-17, -17, 34, 34),
      Phaser.Geom.Rectangle.Contains,
      { useHandCursor: true }
    ).on("pointerdown", () => {
      this.playUiSound();
      this.toggleSettings();
    });
  }

  startAmbientSound(){
    if(this.audioContext || this.getSave().music === false){
      return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if(!AudioContextClass){
      return;
    }

    this.audioContext = new AudioContextClass();
    const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 2, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for(let i = 0; i < data.length; i++){
      data[i] = (Math.random() * 2 - 1) * 0.25;
    }

    const source = this.audioContext.createBufferSource();
    const filter = this.audioContext.createBiquadFilter();
    const gain = this.audioContext.createGain();
    source.buffer = buffer;
    source.loop = true;
    filter.type = "lowpass";
    filter.frequency.value = 520;
    gain.gain.value = 0.018;
    source.connect(filter).connect(gain).connect(this.audioContext.destination);
    source.start();
    this.audioSource = source;
  }

  playUiSound(){
    this.startAmbientSound();
    if(!this.audioContext || this.getSave().sfx === false){
      return;
    }

    const oscillator = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    oscillator.type = "square";
    oscillator.frequency.value = 330;
    gain.gain.setValueAtTime(0.035, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.08);
    oscillator.connect(gain).connect(this.audioContext.destination);
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.08);
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
