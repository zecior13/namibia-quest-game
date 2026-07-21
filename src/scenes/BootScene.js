import { HERO_SHEETS } from "../data/heroes.js";

export class BootScene extends Phaser.Scene {
  constructor(){
    super("BootScene");
  }

  preload(){
    this.load.image("titleMap", "assets/art/title-map-style-a.png");
    this.load.image("startScene", "assets/art/start-scene-namibia.png");
    this.load.image("startPlate", "assets/art/start-scene-plate.png");
    this.load.image("startVehicleClean", "assets/art/start-scene-vehicle-clean.png?v=1");
    this.load.image("heroDriver", "assets/art/hero-driver-kapitan-4x4.png");
    this.load.image("heroSelectStyle", "assets/art/hero-select-style-a.png");
    HERO_SHEETS.forEach(({ key, path }) => this.load.image(key, path));
    this.load.image("cargoScene", "assets/pack/cargo-scene.png");
    this.load.image("packItems", "assets/pack/pack-items.png");
    this.load.image("packCompass3d", "assets/pack/items/compass.png");
    this.load.image("packRope3d", "assets/pack/items/rope.png");
    this.load.image("packFoodCrate", "assets/pack/items/food-crate.png");
    this.load.image("packExtinguisher", "assets/pack/items/fire-extinguisher.png");
    this.load.image("packWarningTriangle", "assets/pack/items/warning-triangle.png");
    this.load.image("packCompass3dRot", "assets/pack/items/compass-rot.png");
    this.load.image("packRope3dRot", "assets/pack/items/rope-rot.png");
    this.load.image("packFoodCrateRot", "assets/pack/items/food-crate-rot.png");
    this.load.image("packExtinguisherRot", "assets/pack/items/fire-extinguisher-rot.png");
    this.load.image("packWarningTriangleRot", "assets/pack/items/warning-triangle-rot.png");
  }

  create(){
    this.prepareBirdTexture();
    this.scene.start("StartScene");
  }

  prepareBirdTexture(){
    const source = this.textures.get("startScene").getSourceImage();
    const cropX = 770;
    const cropY = 135;
    const width = 105;
    const height = 95;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(source, cropX, cropY, width, height, 0, 0, width, height);
    const image = context.getImageData(0, 0, width, height);
    const pixels = image.data;
    for(let index = 0; index < pixels.length; index += 4){
      const brightness = (pixels[index] + pixels[index + 1] + pixels[index + 2]) / 3;
      const contrast = Math.max(pixels[index], pixels[index + 1], pixels[index + 2]) - Math.min(pixels[index], pixels[index + 1], pixels[index + 2]);
      if(brightness > 105 || contrast < 12){
        pixels[index + 3] = 0;
      }
    }
    context.putImageData(image, 0, 0);
    this.textures.addCanvas("startBirdAlpha", canvas);
  }
}
