import { BaseScene } from "./BaseScene.js";

const CELL = 42;
const GRID = { x: 48, y: 365, cols: 7, rows: 5 };

const ITEMS = [
  { id:"tent", name:"Namiot", w:3, h:1, crop:[0,0,627,418], tint:0xb28b5b },
  { id:"water", name:"Kanister wody", w:2, h:2, crop:[627,0,627,418], tint:0x3e7593 },
  { id:"medkit", name:"Apteczka", w:2, h:1, crop:[0,418,627,418], tint:0xb65b38 },
  { id:"duffel", name:"Torba wyprawowa", w:3, h:2, crop:[627,418,627,418], tint:0x8b7651 },
  { id:"tools", name:"Skrzynka narzędzi", w:4, h:1, crop:[0,836,627,418], tint:0x375866 },
  { id:"cooler", name:"Lodówka", w:2, h:2, crop:[627,836,627,418], tint:0x4a8a89 }
];

export class PackScene extends BaseScene {
  constructor(){
    super("PackScene");
    this.placed = {};
    this.selectedId = null;
    this.rotation = 0;
    this.drag = null;
    this.itemTexturesReady = false;
  }

  create(){
    this.placed = {};
    this.buildItemTextures();
    this.drawScene();
  }

  buildItemTextures(){
    if(this.itemTexturesReady){
      return;
    }

    const source = this.textures.get("packItems").getSourceImage();
    ITEMS.forEach((item)=>{
      const [sx, sy, sw, sh] = item.crop;
      const canvas = document.createElement("canvas");
      canvas.width = sw;
      canvas.height = sh;
      const context = canvas.getContext("2d");
      context.drawImage(source, sx, sy, sw, sh, 0, 0, sw, sh);
      const pixels = context.getImageData(0, 0, sw, sh);
      for(let i = 0; i < pixels.data.length; i += 4){
        const red = pixels.data[i];
        const green = pixels.data[i + 1];
        const blue = pixels.data[i + 2];
        if(green > red * 1.35 && green > blue * 1.25){
          pixels.data[i + 3] = 0;
        }
      }
      context.putImageData(pixels, 0, 0);
      this.textures.addCanvas(`pack-${item.id}`, canvas);
    });
    this.itemTexturesReady = true;
  }

  drawScene(){
    this.children.removeAll();
    this.add.image(this.W / 2, this.H / 2, "cargoScene").setDisplaySize(this.W, this.H);
    this.drawSceneMarks();
    this.drawGrid();
    this.drawPlacedItems();
    this.drawItemRack();
    this.drawInstructions();
  }

  drawSceneMarks(){
    this.add.text(20, 18, "WINDHOEK  /  BAGAŻNIK 4x4", {
      fontFamily:"monospace", fontSize:"14px", fontStyle:"bold", color:"#f4d49c",
      backgroundColor:"#182a2b", padding:{ left:8, right:8, top:5, bottom:5 }
    });
    this.add.text(this.W - 20, 20, `${Object.keys(this.placed).length} / ${ITEMS.length}`, {
      fontFamily:"monospace", fontSize:"16px", fontStyle:"bold", color:"#f4d49c"
    }).setOrigin(1, 0);
  }

  drawGrid(){
    const g = this.add.graphics();
    g.fillStyle(0x111b1d, 0.25);
    g.fillRoundedRect(GRID.x - 8, GRID.y - 8, GRID.cols * CELL + 16, GRID.rows * CELL + 16, 10);
    for(let row = 0; row < GRID.rows; row++){
      for(let col = 0; col < GRID.cols; col++){
        const x = GRID.x + col * CELL;
        const y = GRID.y + row * CELL;
        g.lineStyle(1, 0xf1d7a5, 0.42);
        g.strokeRect(x + 1, y + 1, CELL - 2, CELL - 2);
        this.add.zone(x, y, CELL, CELL).setOrigin(0).setInteractive()
          .on("pointerover", (pointer)=>this.updateDrag(pointer));
      }
    }
  }

  drawPlacedItems(){
    ITEMS.forEach((item)=>{
      const placement = this.placed[item.id];
      if(!placement){ return; }
      this.addItemSprite(item, placement.col, placement.row, placement.rot || 0, 1);
    });
  }

  drawItemRack(){
    const rackY = 600;
    this.add.text(22, rackY - 25, "PRZEDMIOTY NA PODŁODZE", {
      fontFamily:"monospace", fontSize:"11px", fontStyle:"bold", color:"#f4d49c"
    });

    ITEMS.forEach((item, index)=>{
      if(this.placed[item.id]){ return; }
      const x = 24 + (index % 3) * 122;
      const y = rackY + Math.floor(index / 3) * 82;
      const frame = this.add.graphics();
      frame.fillStyle(0x1a2929, 0.78);
      frame.fillRoundedRect(x, y, 108, 68, 8);
      frame.lineStyle(1, item.tint, 0.85);
      frame.strokeRoundedRect(x, y, 108, 68, 8);
      const image = this.add.image(x + 54, y + 32, `pack-${item.id}`);
      image.setDisplaySize(92, 56);
      image.setInteractive({ useHandCursor:true });
      image.on("pointerdown", (pointer)=>{
        this.pickItem(item.id);
        this.startDrag(pointer);
      });
      this.add.text(x + 6, y + 52, item.name.toUpperCase(), {
        fontFamily:"monospace", fontSize:"8px", fontStyle:"bold", color:"#f8e4ba",
        stroke:"#152526", strokeThickness:3
      });
    });
  }

  drawInstructions(){
    const allPacked = Object.keys(this.placed).length === ITEMS.length;
    const message = this.selectedId
      ? `PRZENIEŚ: ${this.getItem(this.selectedId).name.toUpperCase()}  ·  OBRÓĆ: dotknij ponownie`
      : allPacked ? "BAGAŻNIK ZAMKNIĘTY. WYPRAWA MOŻE RUSZYĆ." : "DOTKNIJ PRZEDMIOTU, PRZECIĄGNIJ GO NA SIATKĘ, OBRÓĆ W RAZIE POTRZEBY.";
    this.add.text(this.W / 2, this.H - 22, message, {
      fontFamily:"monospace", fontSize:"10px", fontStyle:"bold", color:"#f8e4ba",
      align:"center", wordWrap:{ width:this.W - 28 }
    }).setOrigin(0.5, 1);

    if(allPacked){
      this.add.text(this.W - 18, this.H - 58, "RUSZAJ →", {
        fontFamily:"monospace", fontSize:"16px", fontStyle:"bold", color:"#e5bd69"
      }).setOrigin(1, 1).setInteractive({ useHandCursor:true }).on("pointerdown", ()=>{
        this.saveGamePatch({ packComplete:true, windhoekDone:true, progress:"solitaire" });
        this.scene.start("MapScene");
      });
    }
  }

  pickItem(id){
    if(this.placed[id]){
      const item = this.getItem(id);
      item._rotation = ((item._rotation || 0) + 1) % 2;
      delete this.placed[id];
      this.selectedId = id;
      this.rotation = item._rotation;
      this.drawScene();
      return;
    }
    this.selectedId = id;
    this.rotation = this.getItem(id)._rotation || 0;
    this.drawScene();
  }

  startDrag(pointer){
    if(!this.selectedId){ return; }
    this.drag = { id:this.selectedId, col:0, row:0 };
    this.updateDrag(pointer);
    this.input.on("pointermove", this.updateDrag, this);
    this.input.once("pointerup", this.finishDrag, this);
  }

  updateDrag(pointer){
    if(!this.drag){ return; }
    const item = this.getItem(this.drag.id);
    const width = this.rotation ? item.h : item.w;
    const height = this.rotation ? item.w : item.h;
    this.drag.col = Phaser.Math.Clamp(Math.floor((pointer.x - GRID.x) / CELL), 0, GRID.cols - width);
    this.drag.row = Phaser.Math.Clamp(Math.floor((pointer.y - GRID.y) / CELL), 0, GRID.rows - height);
    this.drawScene();
    this.addItemSprite(item, this.drag.col, this.drag.row, this.rotation, 0.55);
  }

  finishDrag(){
    this.input.off("pointermove", this.updateDrag, this);
    if(!this.drag){ return; }
    const item = this.getItem(this.drag.id);
    if(this.canPlace(item, this.drag.col, this.drag.row, this.rotation)){
      this.placed[item.id] = { col:this.drag.col, row:this.drag.row, rot:this.rotation };
      this.selectedId = null;
      this.drag = null;
      this.drawScene();
    }else{
      this.drag = null;
      this.selectedId = item.id;
      this.drawScene();
    }
  }

  canPlace(item, col, row, rot){
    const width = rot ? item.h : item.w;
    const height = rot ? item.w : item.h;
    if(col < 0 || row < 0 || col + width > GRID.cols || row + height > GRID.rows){ return false; }
    return !Object.entries(this.placed).some(([id, placement])=>{
      const other = this.getItem(id);
      const otherWidth = placement.rot ? other.h : other.w;
      const otherHeight = placement.rot ? other.w : other.h;
      return col < placement.col + otherWidth && col + width > placement.col &&
        row < placement.row + otherHeight && row + height > placement.row;
    });
  }

  addItemSprite(item, col, row, rot, alpha){
    const width = rot ? item.h : item.w;
    const height = rot ? item.w : item.h;
    const image = this.add.image(
      GRID.x + (col + width / 2) * CELL,
      GRID.y + (row + height / 2) * CELL,
      `pack-${item.id}`
    );
    image.setDisplaySize(width * CELL - 5, height * CELL - 5);
    image.setAlpha(alpha);
    image.setAngle(rot ? 90 : 0);
    return image;
  }

  getItem(id){
    return ITEMS.find((item)=>item.id === id);
  }
}
