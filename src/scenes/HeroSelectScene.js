import { BaseScene } from "./BaseScene.js";
import { HEROES, STAT_LABELS } from "../data/heroes.js";

const HERO_HOTSPOTS = {
  driver: { x: 94, y: 284, w: 98, h: 190 },
  tracker: { x: 154, y: 294, w: 86, h: 188 },
  logistician: { x: 242, y: 308, w: 102, h: 196 },
  daredevil: { x: 46, y: 458, w: 104, h: 190 },
  chatterbox: { x: 142, y: 474, w: 116, h: 224 },
  diva: { x: 248, y: 482, w: 104, h: 204 }
};

export class HeroSelectScene extends BaseScene {
  constructor(){
    super("HeroSelectScene");
    this.selectedHeroId = null;
  }

  create(){
    this.addCoverImage("heroSelectArt");
    this.addShade();
    this.addHeader();
    this.addHeroHotspots();
    this.addFooter();
  }

  addShade(){
    const g = this.add.graphics();
    g.fillStyle(0x0d1620, 0.16);
    g.fillRect(0, 0, this.W, this.H);
    g.fillStyle(0x0b1620, this.selectedHeroId ? 0.42 : 0.22);
    g.fillRect(0, this.H - 170, this.W, 170);
  }

  addHeader(){
    this.addOverlayText(20, 22, "WYBÓR BOHATERA", 14, this.W - 40).setLetterSpacing(2);
    this.addOverlayText(20, 48, "Dotknij postaci w garażu", 25, this.W - 40);
  }

  addHeroHotspots(){
    HEROES.forEach(hero=>{
      const spot = HERO_HOTSPOTS[hero.id];

      if(!spot){
        return;
      }

      if(hero.id === this.selectedHeroId){
        const g = this.add.graphics();
        g.lineStyle(4, 0xffd96b, 0.88);
        g.strokeRoundedRect(spot.x - 4, spot.y - 4, spot.w + 8, spot.h + 8, 22);
        g.fillStyle(0xffd96b, 0.12);
        g.fillRoundedRect(spot.x - 4, spot.y - 4, spot.w + 8, spot.h + 8, 22);
      }

      this.add.zone(spot.x, spot.y, spot.w, spot.h)
        .setOrigin(0)
        .setInteractive({ useHandCursor:true })
        .on("pointerdown", ()=>{
          this.selectedHeroId = hero.id;
          this.children.removeAll();
          this.create();
        });
    });
  }

  addFooter(){
    if(!this.selectedHeroId){
      this.addOverlayText(22, this.H - 112, "To ma być wybór postaci jak w grze RPG: dotknij bohatera, zobacz jego cechy i nadaj imię.", 15, this.W - 44);
      this.addSmallBack();
      return;
    }

    const hero = HEROES.find(item=>item.id === this.selectedHeroId) || HEROES[0];
    this.add.text(22, this.H - 158, hero.name, {
      fontFamily:"Georgia",
      fontSize:"23px",
      fontStyle:"bold",
      color:"#fff3d2",
      shadow:{ offsetY:3, color:"#1b120c", blur:8, fill:true }
    });
    this.add.text(22, this.H - 128, hero.role, {
      fontFamily:"Georgia",
      fontSize:"13px",
      fontStyle:"bold",
      color:"#e8bd62",
      shadow:{ offsetY:2, color:"#1b120c", blur:6, fill:true }
    });
    this.add.text(22, this.H - 106, hero.note, {
      fontFamily:"Georgia",
      fontSize:"13px",
      fontStyle:"bold",
      color:"#fff3d2",
      lineSpacing:2,
      shadow:{ offsetY:2, color:"#1b120c", blur:6, fill:true },
      wordWrap:{ width:this.W - 44 }
    });
    this.drawStats(hero);
    this.addGameButton(22, this.H - 48, this.W - 44, 38, "Wybierz i nazwij postać", ()=>{
      const name = prompt("Imię postaci:", "Radek") || "Bohater";
      this.saveGamePatch({ heroId:hero.id, heroName:name, heroArchetype:hero.name, stats:hero.stats, progress:"windhoek" });
      this.scene.start("MapScene");
    });
  }

  drawStats(hero){
    let i = 0;
    Object.keys(STAT_LABELS).forEach(stat=>{
      const x = 22 + i * 89;
      const y = this.H - 74;
      this.add.text(x, y, `${STAT_LABELS[stat]} ${hero.stats[stat]}`, {
        fontFamily:"Georgia",
        fontSize:"10px",
        fontStyle:"bold",
        color:"#fff3d2",
        shadow:{ offsetY:2, color:"#1b120c", blur:5, fill:true }
      });
      i += 1;
    });
  }

  addSmallBack(){
    this.addGameButton(22, this.H - 48, 112, 38, "Wróć", () => this.scene.start("StartScene"), true);
  }

  addGameButton(x, y, w, h, label, callback, secondary = false){
    const g = this.add.graphics();
    g.fillStyle(secondary ? 0x1b2c36 : 0x0f879f, secondary ? 0.76 : 0.92);
    g.fillRoundedRect(x, y, w, h, 14);
    g.lineStyle(2, 0xffe1a1, 0.22);
    g.strokeRoundedRect(x, y, w, h, 14);
    this.add.text(x + w / 2, y + h / 2, label, {
      fontFamily:"Georgia",
      fontSize:"16px",
      fontStyle:"bold",
      color:"#fff3d2",
      shadow:{ offsetY:2, color:"#1b120c", blur:4, fill:true }
    }).setOrigin(0.5);
    this.add.zone(x, y, w, h).setOrigin(0).setInteractive({ useHandCursor:true }).on("pointerdown", callback);
  }
}
