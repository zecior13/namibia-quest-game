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
    this.activeView = null;
    this.dragState = null;
    this.itemTexturesReady = false;
    this.message = "Wybierz przedmiot. Przeciągnij go lewo/prawo, obróć i wciśnij PCHNIJ.";
  }

  create(){
    this.placed = [];
    this.active = null;
    this.activeView = null;
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
        if(green > red * 1.35 && green > blue * 1.25){ pixels.data[i + 3] = 0; }
      }
      context.putImageData(pixels, 0, 0);
      this.textures.addCanvas(`pack-${item.id}`, canvas);
    });
    this.itemTexturesReady = true;
  }

  drawScene(){
    this.children.removeAll();
    this.activeView = null;
    const backdrop = this.add.image(this.W / 2, this.H / 2, "cargoScene");
    backdrop.setScale(Math.max(this.W / backdrop.width, this.H / backdrop.height));
    this.drawHeader();
    this.drawTunnel();
    this.drawObjects();
    this.drawDragSurface();
    this.drawItemRail();
    this.drawControls();
  }

  drawHeader(){
    this.add.text(14, 13, "WINDHOEK / BAGAŻNIK 4x4", {
      fontFamily:"monospace", fontSize:"11px", fontStyle:"bold", color:"#f4d49c",
      backgroundColor:"#182a2b", padding:{ left:7, right:7, top:5, bottom:5 }
    });
    this.add.text(this.W - 14, 16, `${this.placed.length} / ${ITEMS.length}`, {
      fontFamily:"monospace", fontSize:"14px", fontStyle:"bold", color:"#f4d49c"
    }).setOrigin(1, 0);
  }

  drawTunnel(){
    const g = this.add.graphics();
    const corners = [this.project(0,0,0), this.project(VOLUME.width,0,0), this.project(VOLUME.width,VOLUME.depth,0), this.project(0,VOLUME.depth,0)];
    g.fillStyle(0x131e1d, 0.3);
    g.beginPath();
    corners.forEach((point, index)=>index ? g.lineTo(point.x, point.y) : g.moveTo(point.x, point.y));
    g.closePath();
    g.fillPath();
    g.lineStyle(2, 0xe8c987, 0.5);
    g.beginPath();
    corners.forEach((point, index)=>index ? g.lineTo(point.x, point.y) : g.moveTo(point.x, point.y));
    g.closePath();
    g.strokePath();
    for(let depth = 0; depth <= VOLUME.depth; depth++){
      const left = this.project(0, depth, 0);
      const right = this.project(VOLUME.width, depth, 0);
      g.lineStyle(1, 0xe8c987, depth === 0 || depth === VOLUME.depth ? 0.46 : 0.19);
      g.lineBetween(left.x, left.y, right.x, right.y);
    }
    for(let col = 0; col <= VOLUME.width; col++){
      const near = this.project(col, 0, 0);
      const far = this.project(col, VOLUME.depth, 0);
      g.lineStyle(1, 0xe8c987, 0.25);
      g.lineBetween(near.x, near.y, far.x, far.y);
    }
    for(let level = 1; level <= VOLUME.height; level++){
      const left = this.project(0, 0, level);
      const right = this.project(VOLUME.width, 0, level);
      g.lineStyle(1, 0xe8c987, 0.18);
      g.lineBetween(left.x, left.y, right.x, right.y);
    }
    this.add.text(this.W * 0.58, 282, "TUNEL ŁADUNKOWY  6 × 7 × 3", {
      fontFamily:"monospace", fontSize:"9px", fontStyle:"bold", color:"#f4d49c",
      stroke:"#172423", strokeThickness:4
    }).setOrigin(0.5);
  }

  drawObjects(){
    const objects = [...this.placed];
    if(this.active){ objects.push(this.active); }
    objects.sort((a, b)=>b.y - a.y);
    objects.forEach((placement)=>this.addObject(this.getItem(placement.id), placement, placement === this.active ? 0.82 : 1));
  }

  drawDragSurface(){
    if(!this.active){ return; }
    const near = this.project(0, 0, 0);
    const far = this.project(VOLUME.width, VOLUME.depth, 0);
    const surface = this.add.rectangle(
      (near.x + far.x) / 2,
      (near.y + far.y) / 2,
      Math.abs(this.project(VOLUME.width, 0, 0).x - near.x),
      Math.abs(near.y - far.y),
      0xffffff,
      0
    );
    surface.setInteractive({ useHandCursor:true });
    surface.on("pointerdown", (pointer)=>this.beginDrag(pointer));
  }

  drawItemRail(){
    this.add.text(10, 300, "SPRZĘT", { fontFamily:"monospace", fontSize:"10px", fontStyle:"bold", color:"#f4d49c", stroke:"#172423", strokeThickness:3 });
    ITEMS.forEach((item, index)=>{
      if(this.placed.some((placement)=>placement.id === item.id) || this.active?.id === item.id){ return; }
      const y = 326 + index * 62;
      const frame = this.add.graphics();
      frame.fillStyle(0x182a2b, 0.9);
      frame.fillRoundedRect(6, y, 76, 50, 7);
      frame.lineStyle(1, item.tint, 0.9);
      frame.strokeRoundedRect(6, y, 76, 50, 7);
      const image = this.add.image(44, y + 24, `pack-${item.id}`).setDisplaySize(68, 42);
      image.setInteractive({ useHandCursor:true }).on("pointerdown", ()=>this.selectItem(item.id));
    });
  }

  drawControls(){
    this.add.text(92, 744, this.message, {
      fontFamily:"monospace", fontSize:"9px", fontStyle:"bold", color:"#f8e4ba",
      wordWrap:{ width:this.W - 104 }, lineSpacing:2, stroke:"#172423", strokeThickness:3
    });
    this.command(94, 808, "◀", ()=>this.nudgeActive(-1));
    this.command(132, 808, "▶", ()=>this.nudgeActive(1));
    this.command(186, 808, "↺ OBRÓĆ", ()=>this.rotateActive());
    this.command(286, 808, "PCHNIJ", ()=>this.pushActive());
    if(this.placed.length === ITEMS.length){
      this.add.text(this.W - 12, 774, "RUSZAJ →", { fontFamily:"monospace", fontSize:"13px", fontStyle:"bold", color:"#f1c873" })
        .setOrigin(1, 0).setInteractive({ useHandCursor:true }).on("pointerdown", ()=>{
          this.saveGamePatch({ packComplete:true, windhoekDone:true, progress:"solitaire" });
          this.scene.start("MapScene");
        });
    }
  }

  command(x, y, label, callback){
    this.add.text(x, y, label, { fontFamily:"monospace", fontSize:"11px", fontStyle:"bold", color:"#f4d49c", backgroundColor:"#182a2b", padding:{ left:7, right:7, top:6, bottom:6 } })
      .setInteractive({ useHandCursor:true }).on("pointerdown", callback);
  }

  selectItem(id){
    const item = this.getItem(id);
    this.active = { id, x:Math.floor((VOLUME.width - item.dims[0]) / 2), y:0, z:0, rot:0 };
    this.message = `${item.name.toUpperCase()} PRZY WEJŚCIU. Przeciągnij lewo/prawo, obróć, potem PCHNIJ.`;
    this.drawScene();
  }

  addObject(item, placement, alpha){
    const dims = this.getDims(item, placement.rot);
    const anchor = this.project(placement.x + dims[0] / 2, placement.y + dims[1] / 2, placement.z);
    const point = (x, y, z)=>this.project(x, y, z);
    const p000 = point(placement.x, placement.y, placement.z);
    const p100 = point(placement.x + dims[0], placement.y, placement.z);
    const p010 = point(placement.x, placement.y + dims[1], placement.z);
    const p110 = point(placement.x + dims[0], placement.y + dims[1], placement.z);
    const p001 = point(placement.x, placement.y, placement.z + dims[2]);
    const p101 = point(placement.x + dims[0], placement.y, placement.z + dims[2]);
    const p011 = point(placement.x, placement.y + dims[1], placement.z + dims[2]);
    const p111 = point(placement.x + dims[0], placement.y + dims[1], placement.z + dims[2]);
    const width = Math.max(34, Math.abs(p100.x - p000.x));
    const height = Math.max(30, Math.abs(p001.y - p000.y) + Math.abs(p010.y - p000.y));
    const view = this.add.container(anchor.x, anchor.y);
    const prism = this.add.graphics();
    const local = (point)=>({ x:point.x - anchor.x, y:point.y - anchor.y });
    const q000 = local(p000), q100 = local(p100), q010 = local(p010), q110 = local(p110);
    const q001 = local(p001), q101 = local(p101), q011 = local(p011), q111 = local(p111);
    const face = (points, color, fillAlpha = 0.42)=>{
      prism.fillStyle(color, fillAlpha * alpha);
      prism.beginPath();
      points.forEach((p, index)=>index ? prism.lineTo(p.x, p.y) : prism.moveTo(p.x, p.y));
      prism.closePath();
      prism.fillPath();
      prism.lineStyle(1.2, 0xe8c987, alpha * 0.72);
      prism.strokePath();
    };
    // The three visible planes make the cargo read as a volume, not a flat card.
    face([q000, q100, q101, q001], item.tint, 0.56);
    face([q100, q110, q111, q101], item.tint, 0.34);
    face([q001, q101, q111, q011], 0xd6b47a, 0.46);
    face([q000, q010, q011, q001], item.tint, 0.24);
    prism.fillStyle(0x111c1c, 0.4);
    prism.fillEllipse(0, Math.max(8, height * 0.48), width * 1.05, Math.max(5, height * 0.12));
    view.add(prism);
    const image = this.add.image(0, -height * 0.2, `pack-${item.id}`)
      .setDisplaySize(width * 1.05, Math.max(24, height * 0.78))
      .setAlpha(alpha)
      .setAngle((placement.rot % 2) * 90);
    view.add(image);
    if(placement === this.active){
      this.activeView = view;
      // Use a generous hit area around the whole prism. Chroma-key transparency
      // on the sprite must never make the object impossible to grab.
      view.setSize(Math.max(54, width * 1.7), Math.max(60, height * 1.6));
      view.setInteractive(
        new Phaser.Geom.Rectangle(-Math.max(27, width * 0.85), -Math.max(30, height * 0.95), Math.max(54, width * 1.7), Math.max(60, height * 1.6)),
        Phaser.Geom.Rectangle.Contains
      );
      view.on("pointerdown", (pointer)=>this.beginDrag(pointer));
    }
  }

  beginDrag(pointer){
    if(!this.active){ return; }
    this.dragState = { startX:pointer.x, lastX:pointer.x };
    this.input.on("pointermove", this.dragObject, this);
    this.input.once("pointerup", this.endDrag, this);
  }

  dragObject(pointer){
    if(!this.dragState || !this.active){ return; }
    const delta = pointer.x - this.dragState.lastX;
    this.dragState.lastX = pointer.x;
    if(Math.abs(delta) < 1){ return; }
    const item = this.getItem(this.active.id);
    const dims = this.getDims(item, this.active.rot);
    this.active.x = Phaser.Math.Clamp(this.active.x + Math.round(delta / 28), 0, VOLUME.width - dims[0]);
    this.refreshActiveView();
  }

  endDrag(pointer){
    this.input.off("pointermove", this.dragObject, this);
    if(!this.dragState){ return; }
    const moved = Math.abs(pointer.x - this.dragState.startX);
    this.dragState = null;
    if(moved < 8){ this.rotateActive(); }
  }

  refreshActiveView(){
    if(!this.activeView || !this.active){ return; }
    const item = this.getItem(this.active.id);
    const dims = this.getDims(item, this.active.rot);
    const anchor = this.project(this.active.x + dims[0] / 2, this.active.y + dims[1] / 2, this.active.z);
    this.activeView.setPosition(anchor.x, anchor.y);
  }

  nudgeActive(delta){
    if(!this.active){ this.message = "Najpierw wybierz przedmiot."; this.drawScene(); return; }
    const item = this.getItem(this.active.id);
    const dims = this.getDims(item, this.active.rot);
    this.active.x = Phaser.Math.Clamp(this.active.x + delta, 0, VOLUME.width - dims[0]);
    this.refreshActiveView();
  }

  rotateActive(){
    if(!this.active){ this.message = "Najpierw wybierz przedmiot."; this.drawScene(); return; }
    this.active.rot = (this.active.rot + 1) % 6;
    const item = this.getItem(this.active.id);
    const dims = this.getDims(item, this.active.rot);
    this.active.x = Phaser.Math.Clamp(this.active.x, 0, VOLUME.width - dims[0]);
    this.message = "OBRÓT ZMIENIONY. Sprawdź szerokość i wciśnij PCHNIJ.";
    this.drawScene();
  }

  pushActive(){
    if(!this.active){ this.message = "Nie ma przedmiotu przy wejściu."; this.drawScene(); return; }
    const item = this.getItem(this.active.id);
    const dims = this.getDims(item, this.active.rot);
    const x = Phaser.Math.Clamp(this.active.x, 0, VOLUME.width - dims[0]);
    const placement = this.findRestingPlace(item, x, dims);
    if(!placement){ this.message = "Ta pozycja jest zablokowana. Przesuń lub obróć przedmiot."; this.drawScene(); return; }
    this.placed.push({ id:item.id, x:placement.x, y:placement.y, z:placement.z, rot:this.active.rot });
    this.active = null;
    this.message = "Przedmiot wsunięty. Wybierz następny i zostaw jak najmniej pustych szczelin.";
    this.drawScene();
  }

  findRestingPlace(item, x, dims){
    for(let y = VOLUME.depth - dims[1]; y >= 0; y--){
      for(let z = 0; z <= VOLUME.height - dims[2]; z++){
        const candidate = { id:item.id, x, y, z, rot:this.active.rot };
        if(this.canOccupy(candidate, dims) && this.hasSupport(candidate, dims)) return { x, y, z };
      }
    }
    return null;
  }

  hasSupport(candidate, dims){
    if(candidate.z === 0) return true;
    for(let x = candidate.x; x < candidate.x + dims[0]; x++){
      for(let y = candidate.y; y < candidate.y + dims[1]; y++){
        if(!this.isOccupied(x, y, candidate.z - 1)) return false;
      }
    }
    return true;
  }

  canOccupy(candidate, dims){
    if(candidate.x < 0 || candidate.y < 0 || candidate.z < 0 || candidate.x + dims[0] > VOLUME.width || candidate.y + dims[1] > VOLUME.depth || candidate.z + dims[2] > VOLUME.height) return false;
    for(let x = candidate.x; x < candidate.x + dims[0]; x++){
      for(let y = candidate.y; y < candidate.y + dims[1]; y++){
        for(let z = candidate.z; z < candidate.z + dims[2]; z++) if(this.isOccupied(x, y, z)) return false;
      }
    }
    return true;
  }

  isOccupied(x, y, z){
    return this.placed.some((placement)=>{
      const dims = this.getDims(this.getItem(placement.id), placement.rot);
      return x >= placement.x && x < placement.x + dims[0] && y >= placement.y && y < placement.y + dims[1] && z >= placement.z && z < placement.z + dims[2];
    });
  }

  getDims(item, rotation){
    const [w, d, h] = item.dims;
    return [[w,d,h],[d,w,h],[w,h,d],[h,w,d],[d,h,w],[h,d,w]][rotation % 6];
  }

  project(x, depth, z){
    const t = depth / VOLUME.depth;
    const center = this.W * 0.60;
    const nearHalf = this.W * 0.47;
    const farHalf = this.W * 0.28;
    const half = nearHalf + (farHalf - nearHalf) * t;
    return {
      x:center + ((x / VOLUME.width) - 0.5) * half * 2,
      y:704 - t * 356 - z * (48 - t * 14)
    };
  }

  getItem(id){ return ITEMS.find((item)=>item.id === id); }
}
