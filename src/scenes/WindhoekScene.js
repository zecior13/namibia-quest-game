import { BaseScene } from "./BaseScene.js";

export class WindhoekScene extends BaseScene {
  constructor(){
    super("WindhoekScene");
  }

  create(){
    this.drawPaperBackground();
    this.drawCityScene();
    this.addPanel(22, 542, this.W - 44, 218);
    this.addTitle(42, 564, "ETAP 1 · WINDHOEK", "Start wyprawy", "Ostatni moment przed trasą. Wybierz sprzęt, przygotuj auto i dopiero wtedy rusz w stronę pustyni.");
    this.addButton(42, 704, this.W - 84, 50, "Wybierz ekwipunek", () => this.scene.start("GearScene"));
    this.addButton(42, 768, this.W - 84, 46, "Mapa", () => this.scene.start("MapScene"), { secondary:true });
  }

  drawCityScene(){
    const g = this.add.graphics();
    g.fillStyle(0x153446, 1);
    g.fillRoundedRect(22, 34, this.W - 44, 482, 28);
    g.fillStyle(0xf3c574, 1);
    g.fillCircle(298, 116, 42);
    g.fillStyle(0xb96942, 1);
    g.fillRoundedRect(58, 318, 114, 92, 8);
    g.fillRoundedRect(204, 284, 128, 126, 8);
    g.fillStyle(0xf2d59d, 0.9);
    g.fillRect(72, 340, 26, 28);
    g.fillRect(110, 340, 26, 28);
    g.fillRect(224, 308, 28, 34);
    g.fillRect(274, 308, 28, 34);
    g.fillStyle(0x213c4d, 1);
    g.fillRoundedRect(92, 430, 210, 50, 12);
    g.fillStyle(0x0f879f, 1);
    g.fillRoundedRect(126, 404, 120, 44, 16);
    g.fillStyle(0x102b3f, 1);
    g.fillCircle(150, 454, 14);
    g.fillCircle(230, 454, 14);
    g.lineStyle(4, 0xffe2a0, 0.8);
    g.strokeRoundedRect(126, 404, 120, 44, 16);
  }
}
