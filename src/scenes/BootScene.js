export class BootScene extends Phaser.Scene {
  constructor(){
    super("BootScene");
  }

  preload(){
    this.load.image("titleMap", "assets/art/title-map-style-a.png");
    this.load.image("heroSelectArt", "assets/art/hero-select-style-a.png");
  }

  create(){
    this.scene.start("StartScene");
  }
}
