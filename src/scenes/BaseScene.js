export class BaseScene extends Phaser.Scene {
  get W(){
    return this.scale.width;
  }

  get H(){
    return this.scale.height;
  }

  drawPaperBackground(){
    this.add.rectangle(0, 0, this.W, this.H, 0xf4d8a0).setOrigin(0);
    this.add.circle(this.W * 0.22, this.H * 0.08, 170, 0xffffff, 0.35);
    this.add.circle(this.W * 0.86, this.H * 0.18, 160, 0xd9a441, 0.16);

    const g = this.add.graphics();
    g.fillStyle(0xb77a42, 0.16);
    g.fillCircle(this.W * 0.68, this.H * 0.92, 260);
    g.lineStyle(1, 0x7f5a35, 0.12);

    for(let i = 0; i < 18; i++){
      const y = 36 + i * 44;
      g.beginPath();
      g.moveTo(18, y);
      g.lineTo(this.W - 18, y + Math.sin(i) * 4);
      g.strokePath();
    }
  }

  addPanel(x, y, w, h, fill = 0xfff1cf, alpha = 0.94){
    const panel = this.add.graphics();
    panel.fillStyle(fill, alpha);
    panel.fillRoundedRect(x, y, w, h, 22);
    panel.lineStyle(2, 0x6b4424, 0.18);
    panel.strokeRoundedRect(x, y, w, h, 22);
    return panel;
  }

  addButton(x, y, w, h, label, callback, options = {}){
    const fill = options.secondary ? 0x384c58 : 0x0f879f;
    const group = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(fill, 1);
    bg.fillRoundedRect(0, 0, w, h, 16);
    bg.lineStyle(2, 0xffffff, 0.18);
    bg.strokeRoundedRect(0, 0, w, h, 16);

    const text = this.add.text(w / 2, h / 2, label, {
      fontFamily: "Georgia",
      fontSize: options.small ? "14px" : "18px",
      fontStyle: "bold",
      color: "#fff6df",
      align: "center"
    }).setOrigin(0.5);

    group.add([bg, text]);
    group.setSize(w, h);
    group.setInteractive({ useHandCursor: true });
    group.on("pointerdown", () => {
      group.setScale(0.98);
      callback();
    });
    group.on("pointerup", () => group.setScale(1));
    group.on("pointerout", () => group.setScale(1));
    return group;
  }

  addTitle(x, y, kicker, title, subtitle){
    this.add.text(x, y, kicker, {
      fontFamily: "Georgia",
      fontSize: "13px",
      fontStyle: "bold",
      color: "#b17a2e",
      letterSpacing: 2
    }).setOrigin(0, 0);

    this.add.text(x, y + 24, title, {
      fontFamily: "Georgia",
      fontSize: "34px",
      fontStyle: "bold",
      color: "#102b3f",
      lineSpacing: -6,
      wordWrap: { width: this.W - x * 2 }
    }).setOrigin(0, 0);

    if(subtitle){
      this.add.text(x, y + 98, subtitle, {
        fontFamily: "Georgia",
        fontSize: "15px",
        fontStyle: "bold",
        color: "#42525c",
        lineSpacing: 3,
        wordWrap: { width: this.W - x * 2 }
      }).setOrigin(0, 0);
    }
  }

  drawHeroPortrait(x, y, w, h, hero, selected = false){
    const g = this.add.graphics();
    g.fillStyle(hero.color, 1);
    g.fillRoundedRect(x, y, w, h, 18);
    g.fillStyle(0xffffff, 0.12);
    g.fillCircle(x + w * 0.5, y + h * 0.26, w * 0.28);
    g.fillStyle(0x2a1d15, 0.7);
    g.fillCircle(x + w * 0.5, y + h * 0.24, w * 0.14);
    g.fillStyle(0xf2c986, 1);
    g.fillCircle(x + w * 0.5, y + h * 0.34, w * 0.13);
    g.fillStyle(0x26343c, 0.9);
    g.fillRoundedRect(x + w * 0.28, y + h * 0.48, w * 0.44, h * 0.32, 10);

    if(hero.id === "driver"){
      g.fillStyle(0xffffff, 0.88);
      g.fillRoundedRect(x + w * 0.21, y + h * 0.55, w * 0.58, h * 0.08, 8);
    }

    if(hero.id === "tracker"){
      g.lineStyle(4, 0x14382c, 0.85);
      g.lineBetween(x + w * 0.34, y + h * 0.48, x + w * 0.22, y + h * 0.82);
      g.lineBetween(x + w * 0.66, y + h * 0.48, x + w * 0.78, y + h * 0.82);
    }

    if(hero.id === "logistician"){
      g.fillStyle(0xf5df9e, 0.88);
      g.fillRoundedRect(x + w * 0.23, y + h * 0.66, w * 0.54, h * 0.18, 8);
    }

    if(hero.id === "daredevil"){
      g.fillStyle(0xffd25c, 0.9);
      g.fillTriangle(x + w * 0.68, y + h * 0.18, x + w * 0.82, y + h * 0.28, x + w * 0.68, y + h * 0.38);
    }

    if(hero.id === "chatterbox"){
      g.fillStyle(0xfff0c8, 0.95);
      g.fillRoundedRect(x + w * 0.68, y + h * 0.25, w * 0.22, h * 0.14, 8);
    }

    if(hero.id === "diva"){
      g.fillStyle(0xffe7a0, 0.92);
      g.fillCircle(x + w * 0.32, y + h * 0.31, w * 0.045);
      g.fillCircle(x + w * 0.68, y + h * 0.31, w * 0.045);
      g.lineStyle(3, 0xffe7a0, 0.9);
      g.lineBetween(x + w * 0.36, y + h * 0.31, x + w * 0.64, y + h * 0.31);
    }

    if(selected){
      g.lineStyle(4, 0xffd96b, 1);
      g.strokeRoundedRect(x - 2, y - 2, w + 4, h + 4, 20);
    }else{
      g.lineStyle(2, 0xffffff, 0.22);
      g.strokeRoundedRect(x, y, w, h, 18);
    }

    return g;
  }

  saveGamePatch(patch){
    const saved = JSON.parse(localStorage.getItem("namibiaQuestV2") || "{}");
    localStorage.setItem("namibiaQuestV2", JSON.stringify({ ...saved, ...patch }));
  }

  getSave(){
    return JSON.parse(localStorage.getItem("namibiaQuestV2") || "{}");
  }
}
