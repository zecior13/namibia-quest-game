export class BootScene extends Phaser.Scene {
  constructor(){
    super("BootScene");
  }

  preload(){
    this.load.image("titleMap", "assets/art/title-map-style-a.png");
    this.load.image("heroDriver", "assets/art/hero-driver-kapitan-4x4.png");
  }

  create(){
    this.scene.start("StartScene");
  }
}
