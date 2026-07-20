import { BaseScene } from "./BaseScene.js";
import { HEROES, STAT_LABELS } from "../data/heroes.js";

export class HeroSelectScene extends BaseScene {
  constructor(){
    super("HeroSelectScene");
    this.selectedHeroId = "driver";
  }

  create(){
    this.drawPaperBackground();
    this.addTitle(22, 24, "BOHATER", "Wybierz postać", "Każdy bohater ma inny rytm gry. Różnice są odczuwalne, ale żaden wybór nie blokuje przygody.");
    this.drawCards();
    this.drawPreview();
  }

  drawCards(){
    const startY = 162;
    HEROES.forEach((hero, index)=>{
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = 22 + col * 177;
      const y = startY + row * 122;
      this.drawHeroPortrait(x, y, 72, 98, hero, hero.id === this.selectedHeroId);
      this.add.text(x + 82, y + 10, hero.name, {
        fontFamily:"Georgia",
        fontSize:"13px",
        fontStyle:"bold",
        color:"#102b3f",
        wordWrap:{ width:86 }
      });
      this.add.text(x + 82, y + 51, hero.role, {
        fontFamily:"Georgia",
        fontSize:"10px",
        fontStyle:"bold",
        color:"#7f5a35",
        wordWrap:{ width:86 }
      });
      this.add.zone(x, y, 166, 106).setOrigin(0).setInteractive({ useHandCursor:true }).on("pointerdown", ()=>{
        this.selectedHeroId = hero.id;
        this.scene.restart({ selectedHeroId:this.selectedHeroId });
      });
    });
  }

  init(data){
    if(data.selectedHeroId){
      this.selectedHeroId = data.selectedHeroId;
    }
  }

  drawPreview(){
    const hero = HEROES.find(item=>item.id === this.selectedHeroId) || HEROES[0];
    this.addPanel(22, 546, this.W - 44, 210);
    this.add.text(42, 566, hero.name, {
      fontFamily:"Georgia",
      fontSize:"22px",
      fontStyle:"bold",
      color:"#102b3f"
    });
    this.add.text(42, 596, hero.note, {
      fontFamily:"Georgia",
      fontSize:"13px",
      fontStyle:"bold",
      color:"#42525c",
      wordWrap:{ width:this.W - 84 },
      lineSpacing:3
    });

    let i = 0;
    Object.keys(STAT_LABELS).forEach(stat=>{
      const x = 42 + (i % 2) * 154;
      const y = 650 + Math.floor(i / 2) * 42;
      this.drawStat(x, y, STAT_LABELS[stat], hero.stats[stat]);
      i += 1;
    });

    this.addButton(42, 772, this.W - 84, 50, "Nadaj imię i ruszaj", ()=>{
      const name = prompt("Imię postaci:", "Radek") || "Bohater";
      this.saveGamePatch({ heroId:hero.id, heroName:name, heroArchetype:hero.name, stats:hero.stats, progress:"windhoek" });
      this.scene.start("MapScene");
    });
  }

  drawStat(x, y, label, value){
    this.add.text(x, y, `${label} ${value}`, {
      fontFamily:"Georgia",
      fontSize:"12px",
      fontStyle:"bold",
      color:"#102b3f"
    });
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 0.65);
    g.fillRoundedRect(x, y + 20, 122, 8, 99);
    g.fillStyle(0x0f879f, 1);
    g.fillRoundedRect(x, y + 20, 12.2 * value, 8, 99);
  }
}
