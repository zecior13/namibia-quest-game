import { BaseScene } from "./BaseScene.js";

const CARGO = { width:6, depth:7 };
const ITEMS = [
  { id:"tent", name:"Namiot", dims:[3,2], crop:[0,0,627,418], tint:0xb28b5b },
  { id:"water", name:"Kanister", dims:[2,3], crop:[627,0,627,418], tint:0x3e7593 },
  { id:"medkit", name:"Apteczka", dims:[2,2], crop:[0,418,627,418], tint:0xb65b38 },
  { id:"duffel", name:"Torba", dims:[3,3], crop:[627,418,627,418], tint:0x8b7651 },
  { id:"tools", name:"Narzędzia", dims:[4,2], crop:[0,836,627,418], tint:0x375866 },
  { id:"cooler", name:"Lodówka", dims:[2,3], crop:[627,836,627,418], tint:0x4a8a89 },
  { id:"compass", name:"Kompas", dims:[1,1], sourceKey:"packCompass", crop:[0,0,627,1254], tint:0x9b7732 },
  { id:"radio", name:"Radio", dims:[1,2], sourceKey:"packRadio", crop:[0,0,627,1254], tint:0x4f5e59 }
];

export class PackScene extends BaseScene {
  constructor(){
    super("PackScene");
    this.placed = [];
    this.active = null;
    this.activeView = null;
    this.dragState = null;
    this.itemTexturesReady = false;
    this.message = "Wybierz sprzęt. Przesuń go lewo/prawo, obróć i wciśnij PCHNIJ.";
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
    const sources = { main:this.textures.get("packItems").getSourceImage() };
    ITEMS.forEach((item)=>{
      const [sx, sy, sw, sh] = item.crop;
      const canvas = document.createElement("canvas");
      canvas.width = sw;
      canvas.height = sh;
      const context = canvas.getContext("2d");
      const source = item.sourceKey ? this.textures.get(item.sourceKey).getSourceImage() : sources.main;
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
    this.drawCargoFloor();
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
    this.add.text(this.W - 14, 39, "POWIERZCHNIA 42 / 42 PÓL", {
      fontFamily:"monospace", fontSize:"8px", fontStyle:"bold", color:"#f4d49c"
    }).setOrigin(1, 0);
  }

  drawCargoFloor(){
    const g = this.add.graphics();
    const nearLeft = this.project(0, 0);
    const nearRight = this.project(CARGO.width, 0);
    const farLeft = this.project(0, CARGO.depth);
    const farRight = this.project(CARGO.width, CARGO.depth);

    g.fillStyle(0x172322, 0.18);
    g.beginPath();
    g.moveTo(nearLeft.x, nearLeft.y);
    g.lineTo(nearRight.x, nearRight.y);
    g.lineTo(farRight.x, farRight.y);
    g.lineTo(farLeft.x, farLeft.y);
    g.closePath();
    g.fillPath();

    g.lineStyle(2, 0xf0d49a, 0.52);
    g.beginPath();
    g.moveTo(nearLeft.x, nearLeft.y);
    g.lineTo(nearRight.x, nearRight.y);
    g.lineTo(farRight.x, farRight.y);
    g.lineTo(farLeft.x, farLeft.y);
    g.closePath();
    g.strokePath();

    for(let depth = 0; depth <= CARGO.depth; depth++){
      const left = this.project(0, depth);
      const right = this.project(CARGO.width, depth);
      g.lineStyle(1, 0xf0d49a, depth === 0 || depth === CARGO.depth ? 0.5 : 0.22);
      g.lineBetween(left.x, left.y, right.x, right.y);
    }
    for(let column = 0; column <= CARGO.width; column++){
      const near = this.project(column, 0);
      const far = this.project(column, CARGO.depth);
      g.lineStyle(1, 0xf0d49a, 0.26);
      g.lineBetween(near.x, near.y, far.x, far.y);
    }

    this.add.text(this.W * 0.59, 372, "PRZESTRZEŃ ŁADUNKOWA  6 × 7", {
      fontFamily:"monospace", fontSize:"9px", fontStyle:"bold", color:"#f4d49c",
      stroke:"#172423", strokeThickness:4
    }).setOrigin(0.5);
  }

  drawObjects(){
    const objects = [...this.placed];
    if(this.active){ objects.push(this.active); }
    objects.sort((a, b)=>b.depth - a.depth);
    objects.forEach((placement)=>this.addObject(this.getItem(placement.id), placement, placement === this.active));
  }

  drawDragSurface(){
    if(!this.active){ return; }
    const left = this.project(0, 0);
    const right = this.project(CARGO.width, 0);
    const far = this.project(0, CARGO.depth);
    const surface = this.add.rectangle(
      (left.x + right.x) / 2,
      (left.y + far.y) / 2,
      Math.abs(right.x - left.x),
      Math.abs(left.y - far.y),
      0xffffff,
      0
    );
    surface.setInteractive({ useHandCursor:true });
    surface.on("pointerdown", (pointer)=>this.beginDrag(pointer));
  }

  drawItemRail(){
    this.add.text(10, 300, "SPRZĘT", {
      fontFamily:"monospace", fontSize:"10px", fontStyle:"bold", color:"#f4d49c",
      stroke:"#172423", strokeThickness:3
    });
    ITEMS.forEach((item, index)=>{
      if(this.placed.some((placement)=>placement.id === item.id) || this.active?.id === item.id){ return; }
      const column = index % 2;
      const row = Math.floor(index / 2);
      const x = 6 + column * 82;
      const y = 326 + row * 56;
      const frame = this.add.graphics();
      frame.fillStyle(0x182a2b, 0.9);
      frame.fillRoundedRect(x, y, 76, 46, 7);
      frame.lineStyle(1, item.tint, 0.9);
      frame.strokeRoundedRect(x, y, 76, 46, 7);
      const image = this.createItemVisual(item, 68, 40, x + 38, y + 23, 0);
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
    this.command(92, 774, "↶ COFNIJ", ()=>this.undoLast());
    this.command(224, 774, "RESET", ()=>this.resetPacking());
    if(this.placed.length === ITEMS.length){
      this.add.text(this.W - 12, 774, "RUSZAJ →", {
        fontFamily:"monospace", fontSize:"13px", fontStyle:"bold", color:"#f1c873"
      }).setOrigin(1, 0).setInteractive({ useHandCursor:true }).on("pointerdown", ()=>{
        this.saveGamePatch({ packComplete:true, windhoekDone:true, progress:"solitaire" });
        this.scene.start("MapScene");
      });
    }
  }

  command(x, y, label, callback){
    this.add.text(x, y, label, {
      fontFamily:"monospace", fontSize:"11px", fontStyle:"bold", color:"#f4d49c",
      backgroundColor:"#182a2b", padding:{ left:7, right:7, top:6, bottom:6 }
    }).setInteractive({ useHandCursor:true }).on("pointerdown", callback);
  }

  selectItem(id){
    const item = this.getItem(id);
    this.active = { id, x:Math.floor((CARGO.width - item.dims[0]) / 2), depth:0, rot:0 };
    this.message = `${item.name.toUpperCase()} PRZY WEJŚCIU. Przeciągnij lewo/prawo, obróć, potem PCHNIJ.`;
    this.drawScene();
  }

  addObject(item, placement, active){
    const dims = this.getDims(item, placement.rot);
    const footprint = this.getFootprint(placement.x, placement.depth, dims);
    const center = this.project(placement.x + dims[0] / 2, placement.depth + dims[1] / 2);
    const width = Math.max(28, Math.abs(footprint[1].x - footprint[0].x));
    const height = Math.max(24, Math.abs(footprint[0].y - footprint[3].y));
    const view = this.add.container(center.x, center.y);
    const footprintGraphic = this.add.graphics();
    const local = (point)=>({ x:point.x - center.x, y:point.y - center.y });
    const points = footprint.map(local);

    const lift = Math.max(5, Math.min(12, height * 0.13));
    const lifted = points.map((point)=>({ x:point.x, y:point.y - lift }));
    const drawQuad = (quad, fill, fillAlpha, lineAlpha)=>{
      footprintGraphic.fillStyle(fill, fillAlpha);
      footprintGraphic.beginPath();
      quad.forEach((point, index)=>index ? footprintGraphic.lineTo(point.x, point.y) : footprintGraphic.moveTo(point.x, point.y));
      footprintGraphic.closePath();
      footprintGraphic.fillPath();
      footprintGraphic.lineStyle(1.5, active ? 0xf3d28d : item.tint, lineAlpha);
      footprintGraphic.strokePath();
    };
    // A fixed-height side band gives every item the same readable 2.5D language.
    drawQuad([points[0], points[1], lifted[1], lifted[0]], item.tint, active ? 0.42 : 0.25, active ? 0.86 : 0.46);
    drawQuad([lifted[0], lifted[1], lifted[2], lifted[3]], item.tint, active ? 0.28 : 0.14, active ? 0.86 : 0.42);
    drawQuad([points[1], points[2], lifted[2], lifted[1]], item.tint, active ? 0.34 : 0.2, active ? 0.82 : 0.4);
    drawQuad(points, item.tint, active ? 0.14 : 0.08, active ? 0.9 : 0.35);
    view.add(footprintGraphic);

    const image = this.createItemVisual(
      item,
      width * 0.9,
      Math.max(24, height * 0.82),
      0,
      -height * 0.14 - lift * 0.45,
      placement.rot
    ).setAlpha(active ? 1 : 0.94);
    view.add(image);

    if(active){
      this.activeView = view;
      view.setSize(Math.max(54, width * 1.5), Math.max(50, height * 1.5));
      view.setInteractive(
        new Phaser.Geom.Rectangle(-Math.max(27, width * 0.75), -Math.max(25, height * 0.75), Math.max(54, width * 1.5), Math.max(50, height * 1.5)),
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
    const cellWidth = Math.max(20, Math.abs(this.project(1, this.active.depth).x - this.project(0, this.active.depth).x));
    this.active.x = Phaser.Math.Clamp(this.active.x + Math.round(delta / cellWidth), 0, CARGO.width - dims[0]);
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
    const center = this.project(this.active.x + dims[0] / 2, this.active.depth + dims[1] / 2);
    this.activeView.setPosition(center.x, center.y);
  }

  nudgeActive(delta){
    if(!this.active){ this.message = "Najpierw wybierz przedmiot."; this.drawScene(); return; }
    const item = this.getItem(this.active.id);
    const dims = this.getDims(item, this.active.rot);
    this.active.x = Phaser.Math.Clamp(this.active.x + delta, 0, CARGO.width - dims[0]);
    this.refreshActiveView();
  }

  rotateActive(){
    if(!this.active){ this.message = "Najpierw wybierz przedmiot."; this.drawScene(); return; }
    this.active.rot = (this.active.rot + 1) % 2;
    const item = this.getItem(this.active.id);
    const dims = this.getDims(item, this.active.rot);
    this.active.x = Phaser.Math.Clamp(this.active.x, 0, CARGO.width - dims[0]);
    this.message = "OBRÓT ZMIENIONY. Dopasuj szerokość i wciśnij PCHNIJ.";
    this.drawScene();
  }

  pushActive(){
    if(!this.active){ this.message = "Nie ma przedmiotu przy wejściu."; this.drawScene(); return; }
    const item = this.getItem(this.active.id);
    const dims = this.getDims(item, this.active.rot);
    const x = Phaser.Math.Clamp(this.active.x, 0, CARGO.width - dims[0]);
    const depth = this.findRestingDepth(x, dims);
    if(depth === null){
      this.message = "Ta pozycja jest zajęta. Przesuń albo obróć przedmiot.";
      this.drawScene();
      return;
    }
    const candidate = { id:item.id, x, depth, rot:this.active.rot };
    if(!this.canComplete([...this.placed, candidate])){
      this.message = "Ta pozycja blokuje dalsze pakowanie. Przesuń albo obróć przedmiot.";
      this.drawScene();
      return;
    }
    this.placed.push(candidate);
    this.active = null;
    this.message = "Przedmiot wsunięty. Układaj dalej, zostawiając jak najmniej szczelin.";
    this.drawScene();
  }

  undoLast(){
    if(this.active){
      this.active = null;
      this.message = "Przedmiot odłożony z powrotem na listę.";
      this.drawScene();
      return;
    }
    if(!this.placed.length){
      this.message = "Nie ma jeszcze czego cofnąć.";
      this.drawScene();
      return;
    }
    const removed = this.placed.pop();
    this.message = `${this.getItem(removed.id).name.toUpperCase()} wyjęty. Możesz ułożyć go inaczej.`;
    this.drawScene();
  }

  resetPacking(){
    this.placed = [];
    this.active = null;
    this.message = "Układ wyzerowany. Wybierz sprzęt i zacznij od nowa.";
    this.drawScene();
  }

  createItemVisual(item, width, height, x, y, rotation){
    if(item.id !== "compass" && item.id !== "radio"){
      return this.add.image(x, y, `pack-${item.id}`)
        .setDisplaySize(width, height)
        // The source art is a standing object. Turning the footprint must not
        // make a refrigerator or radio appear to lie on its side.
        .setFlipX(rotation === 1);
    }

    const group = this.add.container(x, y);
    const g = this.add.graphics();
    if(item.id === "compass"){
      const radius = Math.min(width, height) * 0.42;
      g.fillStyle(0x8f6728, 1);
      g.fillCircle(0, 0, radius);
      g.lineStyle(Math.max(1, width * 0.035), 0xe1bc62, 0.95);
      g.strokeCircle(0, 0, radius);
      g.fillStyle(0xe3d19b, 1);
      g.fillCircle(0, 0, radius * 0.72);
      g.fillStyle(0x423526, 1);
      g.fillTriangle(0, -radius * 0.58, -radius * 0.12, radius * 0.18, 0, 0);
      g.fillStyle(0xb84631, 1);
      g.fillTriangle(0, -radius * 0.58, radius * 0.12, radius * 0.18, 0, 0);
      g.fillCircle(0, 0, Math.max(2, radius * 0.12));
    }else{
      const bodyW = width * 0.52;
      const bodyH = height * 0.76;
      g.fillStyle(0x3a4743, 1);
      g.fillRoundedRect(-bodyW / 2, -bodyH / 2 + height * 0.08, bodyW, bodyH, Math.max(3, width * 0.08));
      g.lineStyle(Math.max(1, width * 0.035), 0xb7a77a, 0.78);
      g.strokeRoundedRect(-bodyW / 2, -bodyH / 2 + height * 0.08, bodyW, bodyH, Math.max(3, width * 0.08));
      g.fillStyle(0x1e2826, 1);
      g.fillRoundedRect(-bodyW * 0.3, -bodyH * 0.16, bodyW * 0.6, bodyH * 0.08, 2);
      g.fillRoundedRect(-bodyW * 0.3, 0, bodyW * 0.6, bodyH * 0.08, 2);
      g.fillStyle(0x3a4743, 1);
      g.fillRoundedRect(-width * 0.035, -height * 0.49, width * 0.07, height * 0.22, 2);
      g.fillCircle(width * 0.18, -bodyH * 0.26, Math.max(2, width * 0.06));
    }
    group.add(g);
    group.setSize(width, height);
    return group;
  }

  findRestingDepth(x, dims){
    for(let depth = CARGO.depth - dims[1]; depth >= 0; depth--){
      if(this.canOccupy(x, depth, dims)) return depth;
    }
    return null;
  }

  canOccupy(x, depth, dims){
    if(x < 0 || depth < 0 || x + dims[0] > CARGO.width || depth + dims[1] > CARGO.depth) return false;
    return !this.placed.some((placement)=>{
      const other = this.getDims(this.getItem(placement.id), placement.rot);
      return x < placement.x + other[0] && x + dims[0] > placement.x && depth < placement.depth + other[1] && depth + dims[1] > placement.depth;
    });
  }

  canComplete(placed){
    const remaining = ITEMS
      .filter((item)=>!placed.some((placement)=>placement.id === item.id))
      .sort((a, b)=>b.dims[0] * b.dims[1] - a.dims[0] * a.dims[1]);
    const search = (index, board)=>{
      if(index === remaining.length) return true;
      const item = remaining[index];
      for(let rotation = 0; rotation < 2; rotation++){
        const dims = this.getDims(item, rotation);
        for(let depth = CARGO.depth - dims[1]; depth >= 0; depth--){
          for(let x = 0; x <= CARGO.width - dims[0]; x++){
            if(!this.boardCanOccupy(board, x, depth, dims)) continue;
            const next = board.map((row)=>row.slice());
            for(let yy = depth; yy < depth + dims[1]; yy++){
              for(let xx = x; xx < x + dims[0]; xx++) next[yy][xx] = true;
            }
            if(search(index + 1, next)) return true;
          }
        }
      }
      return false;
    };
    const board = Array.from({ length:CARGO.depth }, ()=>Array(CARGO.width).fill(false));
    placed.forEach((placement)=>{
      const dims = this.getDims(this.getItem(placement.id), placement.rot);
      for(let yy = placement.depth; yy < placement.depth + dims[1]; yy++){
        for(let xx = placement.x; xx < placement.x + dims[0]; xx++) board[yy][xx] = true;
      }
    });
    return search(0, board);
  }

  boardCanOccupy(board, x, depth, dims){
    for(let yy = depth; yy < depth + dims[1]; yy++){
      for(let xx = x; xx < x + dims[0]; xx++){
        if(board[yy][xx]) return false;
      }
    }
    return true;
  }

  getFootprint(x, depth, dims){
    return [
      this.project(x, depth),
      this.project(x + dims[0], depth),
      this.project(x + dims[0], depth + dims[1]),
      this.project(x, depth + dims[1])
    ];
  }

  project(x, depth){
    const t = depth / CARGO.depth;
    const center = this.W * 0.52;
    const nearHalf = this.W * 0.49;
    const farHalf = this.W * 0.30;
    const half = nearHalf + (farHalf - nearHalf) * t;
    return {
      x:center + ((x / CARGO.width) - 0.5) * half * 2,
      y:704 - t * 320
    };
  }

  getDims(item, rotation){
    return rotation % 2 ? [item.dims[1], item.dims[0]] : item.dims;
  }

  getItem(id){ return ITEMS.find((item)=>item.id === id); }
}
