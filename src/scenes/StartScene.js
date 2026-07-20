import { BaseScene } from "./BaseScene.js";

export class StartScene extends BaseScene {
  constructor(){
    super("StartScene");
  }

  create(){
    this.drawPaperBackground();
    this.drawMapPreview();
    this.addPanel(22, 462, this.W - 44, 248);
    this.addTitle(42, 486, "NAMIBIA QUEST", "Retro Expedition RPG", "Nowy czysty projekt: jedna gra o wyprawie przez Namibię. Bez kroniki, bez starego UI, bez protez.");
    this.addButton(42, 644, this.W - 84, 54, "Rozpocznij grę", () => this.scene.start("HeroSelectScene"));
    this.addButton(42, 708, this.W - 84, 48, "Kontynuuj", () => this.scene.start("MapScene"), { secondary:true });
  }

  drawMapPreview(){
    const g = this.add.graphics();
    g.fillStyle(0x0f879f, 1);
    g.fillRoundedRect(24, 42, 342, 390, 28);
    g.fillStyle(0xf1c775, 1);
    g.beginPath();
    g.moveTo(135, 50);
    g.lineTo(328, 54);
    g.lineTo(348, 390);
    g.lineTo(112, 420);
    g.lineTo(82, 280);
    g.lineTo(108, 160);
    g.closePath();
    g.fillPath();

    g.fillStyle(0xc9783d, 0.65);
    for(let i = 0; i < 9; i++){
      g.fillEllipse(170 + i * 18, 270 + Math.sin(i) * 22, 118, 26);
    }

    g.lineStyle(4, 0xfff0c8, 0.8);
    const pts = [[230,315],[185,390],[180,252],[226,205],[250,158],[292,126]];
    g.beginPath();
    pts.forEach((p, i)=> i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]));
    g.strokePath();

    pts.forEach((p, index)=>{
      g.fillStyle(index === 0 ? 0x0f879f : 0xfff3d5, 1);
      g.fillCircle(p[0], p[1], 9);
      g.lineStyle(3, 0x6b4424, 0.34);
      g.strokeCircle(p[0], p[1], 9);
    });
  }
}
