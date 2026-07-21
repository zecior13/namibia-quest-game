import { BaseScene } from "./BaseScene.js";

const VOLUME = { width:6, depth:7, height:3 };
const ITEMS = [
  { id:"tent", name:"Namiot", dims:[3,2,1], crop:[0,0,627,418], tint:0xb28b5b },
  { id:"water", name:"Kanister", dims:[2,2,2], crop:[627,0,627,418], tint:0x3e7593 },
  { id:"medkit", name:"Apteczka", dims:[2,1,1], crop:[0,418,627,418], tint:0xb65b38 },
  { id:"duffel", name:"Torba", dims:[3,2,2], crop:[627,418,627,418], tint:0x8b7651 },
  { id:"tools", name:"Narzędzia", dims:[4,1,1], crop:[0,836,627,418], tint:0x375866 },
  { id:"cooler", name:"Lodówka", dims:[2,2,2], crop:[627,836,627,418], tint:0x4a8a89 }
];

export class PackScene extends BaseScene {
  constructor(){
    super("PackScene");
    this.placed = [];
    this.active = null;
    this.itemTexturesReady = false;
    this.dragState = null;
    this.message = "Wybierz przedmiot z lewej. Dotknij go, aby obrócić. PCHNIJ wsunie go do bagażnika.";
  }

  create(){
    this.placed = [];
    this.active = null;
    this.buildItemTextures();
    this.drawScene();
  }

  buildItemTextures(){
    if(this.itemTexturesReady){ return; }
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
    const backdrop = this.add.image(this.W / 2, this.H / 2, "cargoScene");
    const scale = Math.max(this.W / backdrop.width, this.H / backdrop.height);
    backdrop.setScale(scale);

    this.drawHeader();
    this.drawTunnel();
    this.drawPlacedObjects();
    this.drawItemRail();
    this.drawControls();
  }

  drawHeader(){
    this.add.text(16, 14, "WINDHOEK  /  BAGAŻNIK 4x4", {
      fontFamily:"monospace", fontSize:"12px", fontStyle:"bold", color:"#f4d49c",
      backgroundColor:"#182a2b", padding:{ left:7, right:7, top:5, bottom:5 }
    });
    this.add.text(this.W - 16, 17, `${this.placed.length} / ${ITEMS.length}`, {
      fontFamily:"monospace", fontSize:"15px", fontStyle:"bold", color:"#f4d49c"
    }).setOrigin(1, 0);
  }

  drawTunnel(){
    const g = this.add.graphics();
    const front = this.project(0, 0, 0);
    const frontRight = this.project(VOLUME.width, 0, 0);
    const back = this.project(0, VOLUME.depth, 0);
    const backRight = this.project(VOLUME.width, VOLUME.depth, 0);
    g.fillStyle(0x172322, 0.16);
    g.beginPath();
    g.moveTo(front.x, front.y);
    g.lineTo(frontRight.x, frontRight.y);
    g.lineTo(backRight.x, backRight.y);
    g.lineTo(back.x, back.y);
    g.closePath();
    g.fillPath();
    g.lineStyle(2, 0xf0d49a, 0.42);
    g.strokePath();

    for(let depth = 0; depth <= VOLUME.depth; depth++){
      const left = this.project(0, depth, 0);
      const right = this.project(VOLUME.width, depth, 0);
      g.lineStyle(1, 0xf0d49a, depth === 0 || depth === VOLUME.depth ? 0.55 : 0.2);
      g.lineBetween(left.x, left.y, right.x, right.y);
    }
    for(let col = 0; col <= VOLUME.width; col++){
      const near = this.project(col, 0, 0);
      const far = this.project(col, VOLUME.depth, 0);
      g.lineStyle(1, 0xf0d49a, 0.28);
      g.lineBetween(near.x, near.y, far.x, far.y);
    }
    for(let level = 1; level <= VOLUME.height; level++){
      const left = this.project(0, 0, level);
      const right = this.project(VOLUME.width, 0, level);
      g.lineStyle(1, 0xf0d49a, 0.2);
      g.lineBetween(left.x, left.y, right.x, right.y);
    }
    this.add.text(this.W / 2, 278, "PRZESTRZEŃ ŁADUNKOWA", {
      fontFamily:"monospace", fontSize:"10px", fontStyle:"bold", color:"#f4d49c",
      stroke:"#162423", strokeThickness:4
    }).setOrigin(0.5);
  }

  drawPlacedObjects(){
    const objects = [...this.placed];
    if(this.active){ objects.push(this.active); }
    objects.sort((a, b)=>b.y - a.y);
    objects.forEach((placement)=>{
      const item = this.getItem(placement.id);
      this.addObject(item, placement, placement === this.active ? 0.76 : 1);
    });
  }

  drawItemRail(){
    this.add.text(12, 300, "SPRZĘT", {
      fontFamily:"monospace", fontSize:"10px", fontStyle:"bold", color:"#f4d49c",
      stroke:"#172423", strokeThickness:3
    });
    ITEMS.forEach((item, index)=>{
      if(this.placed.some((placement)=>placement.id === item.id) || this.active?.id === item.id){ return; }
      const y = 326 + index * 62;
      const frame = this.add.graphics();
      frame.fillStyle(0x182a2b, 0.86);
      frame.fillRoundedRect(8, y, 72, 50, 7);
      frame.lineStyle(1, item.tint, 0.9);
      frame.strokeRoundedRect(8, y, 72, 50, 7);
      const image = this.add.image(44, y + 24, `pack-${item.id}`).setDisplaySize(64, 40);
      image.setInteractive({ useHandCursor:true }).on("pointerdown", ()=>{
        this.active = { id:item.id, x:Math.floor((VOLUME.width - item.dims[0]) / 2), y:0, z:0, rot:0 };
        this.message = `${item.name.toUpperCase()} PRZY WEJŚCIU. Przesuń lewo/prawo, dotknij aby obrócić.`;
        this.drawScene();
      });
    });
  }

  drawControls(){
    this.add.text(92, 742, this.message, {
      fontFamily:"monospace", fontSize:"9px", fontStyle:"bold", color:"#f8e4ba",
      wordWrap:{ width:this.W - 106 }, lineSpacing:2,
      stroke:"#172423", strokeThickness:3
    });
    this.add.text(102, 807, "↺  OBRÓĆ", {
      fontFamily:"monospace", fontSize:"13px", fontStyle:"bold", color:"#f4d49c",
      backgroundColor:"#182a2b", padding:{ left:9, right:9, top:6, bottom:6 }
    }).setInteractive({ useHandCursor:true }).on("pointerdown", ()=>this.rotateActive());
    this.add.text(252, 807, "PCHNIJ  ▶", {
      fontFamily:"monospace", fontSize:"13px", fontStyle:"bold", color:"#f4d49c",
      backgroundColor:this.active ? "#345c50" : "#384343", padding:{ left:9, right:9, top:6, bottom:6 }
    }).setInteractive({ useHandCursor:true }).on("pointerdown", ()=>this.pushActive());
    if(this.placed.length === ITEMS.length){
      this.add.text(this.W - 14, 776, "RUSZAJ →", {
        fontFamily:"monospace", fontSize:"14px", fontStyle:"bold", color:"#f1c873"
      }).setOrigin(1, 0).setInteractive({ useHandCursor:true }).on("pointerdown", ()=>{
        this.saveGamePatch({ packComplete:true, windhoekDone:true, progress:"solitaire" });
        this.scene.start("MapScene");
      });
    }
  }

  rotateActive(){
    if(!this.active){
      this.message = "Najpierw wybierz przedmiot z lewej.";
      this.drawScene();
      return;
    }
    this.active.rot = (this.active.rot + 1) % 6;
    this.message = "OBRÓT ZMIENIONY. Gdy pasuje do tunelu, wciśnij PCHNIJ.";
    this.drawScene();
  }

  pushActive(){
    if(!this.active){
      this.message = "Nie ma przedmiotu przy wejściu do tunelu.";
      this.drawScene();
      return;
    }
    const item = this.getItem(this.active.id);
    const dims = this.getDims(item, this.active.rot);
    const x = Phaser.Math.Clamp(this.active.x, 0, VOLUME.width - dims[0]);
    const placement = this.findRestingPlace(item, x, dims);
    if(!placement){
      this.message = "Ta pozycja jest zablokowana. Przesuń przedmiot albo obróć go.";
      this.drawScene();
      return;
    }
    this.placed.push({ id:item.id, x:placement.x, y:placement.y, z:placement.z, rot:this.active.rot });
    this.active = null;
    this.message = "Przedmiot wsunięty. Wybierz następny i pilnuj pustych szczelin.";
    this.drawScene();
  }

  findRestingPlace(item, x, dims){
    for(let y = VOLUME.depth - dims[1]; y >= 0; y--){
      for(let z = 0; z <= VOLUME.height - dims[2]; z++){
        const candidate = { id:item.id, x, y, z, rot:this.active.rot };
        if(this.canOccupy(candidate, dims) && this.hasSupport(candidate, dims)){
          return { x, y, z };
        }
      }
    }
    return null;
  }

  hasSupport(candidate, dims){
    if(candidate.z === 0){ return true; }
    for(let x = candidate.x; x < candidate.x + dims[0]; x++){
      for(let y = candidate.y; y < candidate.y + dims[1]; y++){
        if(!this.isOccupied(x, y, candidate.z - 1)){ return false; }
      }
    }
    return true;
  }

  canOccupy(candidate, dims){
    if(candidate.x < 0 || candidate.y < 0 || candidate.z < 0 ||
      candidate.x + dims[0] > VOLUME.width || candidate.y + dims[1] > VOLUME.depth ||
      candidate.z + dims[2] > VOLUME.height){ return false; }
    for(let x = candidate.x; x < candidate.x + dims[0]; x++){
      for(let y = candidate.y; y < candidate.y + dims[1]; y++){
        for(let z = candidate.z; z < candidate.z + dims[2]; z++){
          if(this.isOccupied(x, y, z)){ return false; }
        }
      }
    }
    return true;
  }

  isOccupied(x, y, z){
    return this.placed.some((placement)=>{
      const dims = this.getDims(this.getItem(placement.id), placement.rot);
      return x >= placement.x && x < placement.x + dims[0] &&
        y >= placement.y && y < placement.y + dims[1] &&
        z >= placement.z && z < placement.z + dims[2];
    });
  }

  addObject(item, placement, alpha){
    const dims = this.getDims(item, placement.rot);
    const center = this.project(placement.x + dims[0] / 2, placement.y + dims[1] / 2, placement.z);
    const far = this.project(placement.x + dims[0], placement.y + dims[1], placement.z);
    const near = this.project(placement.x, placement.y, placement.z + dims[2]);
    const width = Math.max(26, Math.abs(far.x - center.x) * 1.8);
    const height = Math.max(24, Math.abs(near.y - center.y) + Math.abs(far.y - center.y) * 0.8);
    const image = this.add.image(center.x, center.y - height * 0.35, `pack-${item.id}`);
    image.setDisplaySize(width, height);
    image.setAlpha(alpha);
    image.setAngle((placement.rot % 2) * 90);
    if(placement === this.active){
      image.setInteractive({ useHandCursor:true });
      image.on("pointerdown", (pointer)=>this.beginObjectDrag(pointer));
    }
  }

  beginObjectDrag(pointer){
    if(!this.active){ return; }
    this.dragState = { startX:pointer.x, startY:pointer.y, lastX:pointer.x };
    this.input.on("pointermove", this.dragObject, this);
    this.input.once("pointerup", this.endObjectDrag, this);
  }

  dragObject(pointer){
    if(!this.dragState || !this.active){ return; }
    const delta = pointer.x - this.dragState.lastX;
    this.dragState.lastX = pointer.x;
    const item = this.getItem(this.active.id);
    const dims = this.getDims(item, this.active.rot);
    if(Math.abs(delta) > 1){
      this.active.x = Phaser.Math.Clamp(this.active.x + Math.round(delta / 42), 0, VOLUME.width - dims[0]);
      this.drawScene();
    }
  }

  endObjectDrag(pointer){
    this.input.off("pointermove", this.dragObject, this);
    if(!this.dragState){ return; }
    const moved = Math.abs(pointer.x - this.dragState.startX) + Math.abs(pointer.y - this.dragState.startY);
    this.dragState = null;
    if(moved < 10){ this.rotateActive(); }
  }

  getDims(item, rotation){
    const [w, d, h] = item.dims;
    const variants = [[w,d,h],[d,w,h],[w,h,d],[h,w,d],[d,h,w],[h,d,w]];
    return variants[rotation % variants.length];
  }

  project(x, depth, z){
    const t = depth / VOLUME.depth;
    const center = this.W * 0.58;
    const nearHalf = this.W * 0.37;
    const farHalf = this.W * 0.18;
    const half = nearHalf + (farHalf - nearHalf) * t;
    const screenX = center + ((x / VOLUME.width) - 0.5) * half * 2;
    const screenY = 700 - t * 360 - z * (48 - t * 14);
    return { x:screenX, y:screenY };
  }

  getItem(id){
    return ITEMS.find((item)=>item.id === id);
  }
}
