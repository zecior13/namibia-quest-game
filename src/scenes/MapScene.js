import { BaseScene } from "./BaseScene.js";
import { ROUTE } from "../data/route.js";

export class MapScene extends BaseScene {
  constructor(){
    super("MapScene");
  }

  create(){
    this.drawPaperBackground();
    this.drawNamibiaMap();
    this.drawHud();
  }

  drawNamibiaMap(){
    const g = this.add.graphics();
    g.fillStyle(0x0b7792, 1);
    g.fillRoundedRect(18, 72, this.W - 36, 600, 28);
    g.fillStyle(0xf0c06c, 1);
    g.beginPath();
    g.moveTo(134, 80);
    g.lineTo(335, 92);
    g.lineTo(360, 632);
    g.lineTo(108, 655);
    g.lineTo(76, 465);
    g.lineTo(95, 285);
    g.closePath();
    g.fillPath();

    g.fillStyle(0xd4843d, 0.56);
    for(let i = 0; i < 14; i++){
      g.fillEllipse(144 + (i % 5) * 43, 478 + Math.floor(i / 5) * 28, 126, 24);
    }

    g.fillStyle(0x6f6f52, 0.42);
    [[246,190],[214,256],[292,330],[218,370]].forEach(p=>{
      g.fillTriangle(p[0], p[1] - 34, p[0] - 34, p[1] + 24, p[0] + 34, p[1] + 24);
    });

    g.lineStyle(4, 0x6b4424, 0.36);
    ROUTE.forEach((point, index)=>{
      if(index === 0){
        return;
      }
      const prev = ROUTE[index - 1];
      g.lineBetween(this.toX(prev.x), this.toY(prev.y), this.toX(point.x), this.toY(point.y));
    });

    ROUTE.forEach((point, index)=>{
      const x = this.toX(point.x);
      const y = this.toY(point.y);
      const isUnlocked = index === 0 || this.getSave().progress !== "windhoek";
      g.fillStyle(isUnlocked ? 0x0f879f : 0xf8ead0, 1);
      g.fillCircle(x, y, isUnlocked ? 10 : 7);
      g.lineStyle(3, 0xffffff, 0.8);
      g.strokeCircle(x, y, isUnlocked ? 10 : 7);

      this.add.text(x + 12, y - 8, point.name, {
        fontFamily:"Georgia",
        fontSize:"10px",
        fontStyle:"bold",
        color: isUnlocked ? "#102b3f" : "#7f6d58"
      });

      if(point.id === "windhoek"){
        this.add.zone(x - 24, y - 24, 120, 48).setOrigin(0).setInteractive({ useHandCursor:true }).on("pointerdown", ()=>{
          this.scene.start("WindhoekScene");
        });
      }
    });
  }

  drawHud(){
    const save = this.getSave();
    this.addPanel(20, 692, this.W - 40, 126);
    this.add.text(40, 712, "Namibia Quest", {
      fontFamily:"Georgia",
      fontSize:"24px",
      fontStyle:"bold",
      color:"#102b3f"
    });
    this.add.text(40, 744, `${save.heroName || "Bohater"} · ${save.heroArchetype || "wybierz postać"}`, {
      fontFamily:"Georgia",
      fontSize:"14px",
      fontStyle:"bold",
      color:"#42525c"
    });
    this.addButton(40, 778, 142, 44, "Windhoek", () => this.scene.start("WindhoekScene"), { small:true });
    this.addButton(196, 778, 154, 44, "Postać", () => this.scene.start("HeroSelectScene"), { secondary:true, small:true });
  }

  toX(percent){
    return 18 + (this.W - 36) * (percent / 100);
  }

  toY(percent){
    return 72 + 600 * (percent / 100);
  }
}
