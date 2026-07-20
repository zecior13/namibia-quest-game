import { BaseScene } from "./BaseScene.js";

const ITEMS = [
  { id:"water", name:"Woda", w:2, h:2, color:0x0f879f },
  { id:"cooler", name:"Lodówka", w:3, h:2, color:0x1f8b72 },
  { id:"tent", name:"Namiot", w:3, h:1, color:0xd9a441 },
  { id:"bags", name:"Torby", w:2, h:2, color:0xa75d38 }
];

export class PackScene extends BaseScene {
  constructor(){
    super("PackScene");
    this.selected = null;
    this.placed = {};
  }

  create(){
    this.drawPaperBackground();
    this.addTitle(22, 22, "WINDHOEK · 4x4", "Pack the 4x4", "Pierwsza czysta wersja gry pakowania. Następny krok: pełny zestaw rysowanych assetów i trudniejsza plansza.");
    this.drawVehicle();
    this.drawItems();
    this.addButton(22, 772, 166, 50, "Ekwipunek", () => this.scene.start("GearScene"), { secondary:true });
    this.addButton(202, 772, 166, 50, "Gotowe", () => {
      this.saveGamePatch({ windhoekDone:true, progress:"solitaire" });
      this.scene.start("MapScene");
    });
  }

  drawVehicle(){
    const g = this.add.graphics();
    g.fillStyle(0x102b3f, 1);
    g.fillRoundedRect(42, 154, 198, 460, 34);
    g.fillStyle(0x213c4d, 1);
    g.fillRoundedRect(62, 210, 158, 330, 18);
    g.lineStyle(2, 0xe7c06b, 0.42);
    g.strokeRoundedRect(74, 180, 134, 36, 12);

    const cell = 30;
    for(let row = 0; row < 7; row++){
      for(let col = 0; col < 5; col++){
        const x = 66 + col * cell;
        const y = 236 + row * cell;
        g.lineStyle(1, 0xffffff, 0.18);
        g.strokeRoundedRect(x, y, cell - 3, cell - 3, 6);
        this.add.zone(x, y, cell - 3, cell - 3).setOrigin(0).setInteractive({ useHandCursor:true }).on("pointerdown", ()=>{
          if(this.selected && !this.placed[this.selected.id]){
            this.placed[this.selected.id] = { row, col };
            this.children.removeAll();
            this.create();
          }
        });
      }
    }

    ITEMS.forEach(item=>{
      const placement = this.placed[item.id];
      if(!placement){
        return;
      }
      const x = 66 + placement.col * cell;
      const y = 236 + placement.row * cell;
      g.fillStyle(item.color, 1);
      g.fillRoundedRect(x, y, item.w * cell - 5, item.h * cell - 5, 9);
      this.add.text(x + 8, y + 9, item.name, {
        fontFamily:"Georgia",
        fontSize:"12px",
        fontStyle:"bold",
        color:"#fff6df",
        wordWrap:{ width:item.w * cell - 12 }
      });
    });
  }

  drawItems(){
    ITEMS.forEach((item, index)=>{
      const y = 164 + index * 86;
      const disabled = Boolean(this.placed[item.id]);
      this.addPanel(258, y, 104, 68, disabled ? 0xd8c7a5 : item.color, disabled ? 0.58 : 0.96);
      this.add.text(270, y + 18, disabled ? "Spak." : item.name, {
        fontFamily:"Georgia",
        fontSize:"15px",
        fontStyle:"bold",
        color:disabled ? "#6b6256" : "#fff6df"
      });
      this.add.text(270, y + 42, `${item.w}x${item.h}`, {
        fontFamily:"Georgia",
        fontSize:"11px",
        fontStyle:"bold",
        color:disabled ? "#6b6256" : "#f4d48a"
      });

      if(!disabled){
        this.add.zone(258, y, 104, 68).setOrigin(0).setInteractive({ useHandCursor:true }).on("pointerdown", ()=>{
          this.selected = item;
          this.children.removeAll();
          this.create();
        });
      }
    });

    if(this.selected){
      this.add.text(258, 532, `Wybrane:\n${this.selected.name}`, {
        fontFamily:"Georgia",
        fontSize:"15px",
        fontStyle:"bold",
        color:"#102b3f",
        wordWrap:{ width:110 }
      });
    }
  }
}
