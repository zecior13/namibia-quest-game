import { BaseScene } from "./BaseScene.js";

const GEAR = [
  { id:"water", name:"Duży zapas wody", mod:"+Spokój, -Tempo" },
  { id:"hat", name:"Kapelusz pustynny", mod:"+Spokój" },
  { id:"boots", name:"Buty trekkingowe", mod:"+Siła, -Tempo" },
  { id:"binoculars", name:"Lornetka", mod:"+Spryt" },
  { id:"tools", name:"Narzędzia", mod:"+Spryt" },
  { id:"medkit", name:"Apteczka", mod:"+Spokój" },
  { id:"lightpack", name:"Lekki plecak", mod:"+Tempo" },
  { id:"notebook", name:"Notes wyprawy", mod:"+Spryt" }
];

export class GearScene extends BaseScene {
  constructor(){
    super("GearScene");
    this.selected = [];
  }

  create(){
    this.selected = this.getSave().gear || [];
    this.draw();
  }

  draw(){
    this.children.removeAll();
    this.drawPaperBackground();
    this.addTitle(22, 24, "WINDHOEK · EKWIPUNEK", "Co zabierasz?", "Masz 5 miejsc. To jest pierwsza decyzja RPG: sprzęt pomaga, ale obciąża plan.");
    this.drawGear();
    this.addButton(22, 772, 166, 50, "Wróć", () => this.scene.start("WindhoekScene"), { secondary:true });
    this.addButton(202, 772, 166, 50, "Pakuj 4x4", () => {
      this.saveGamePatch({ gear:this.selected });
      this.scene.start("PackScene");
    });
  }

  drawGear(){
    GEAR.forEach((item, index)=>{
      const x = 22 + (index % 2) * 178;
      const y = 168 + Math.floor(index / 2) * 124;
      const selected = this.selected.includes(item.id);
      this.addPanel(x, y, 166, 104, selected ? 0x12394a : 0xfff1cf, selected ? 0.98 : 0.94);
      this.add.text(x + 12, y + 14, item.name, {
        fontFamily:"Georgia",
        fontSize:"15px",
        fontStyle:"bold",
        color:selected ? "#fff4d6" : "#102b3f",
        wordWrap:{ width:140 }
      });
      this.add.text(x + 12, y + 68, item.mod, {
        fontFamily:"Georgia",
        fontSize:"12px",
        fontStyle:"bold",
        color:selected ? "#e8bd62" : "#9b6e27"
      });
      this.add.zone(x, y, 166, 104).setOrigin(0).setInteractive({ useHandCursor:true }).on("pointerdown", ()=>{
        if(selected){
          this.selected = this.selected.filter(id=>id !== item.id);
        }else if(this.selected.length < 5){
          this.selected.push(item.id);
        }
        this.draw();
      });
    });

    this.add.text(28, 690, `Wybrane: ${this.selected.length} / 5`, {
      fontFamily:"Georgia",
      fontSize:"18px",
      fontStyle:"bold",
      color:"#102b3f"
    });
  }
}
