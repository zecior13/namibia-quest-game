import { HEROES, HERO_SHEETS } from "../data/heroes.js";

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
    this.load.image("heroGarageSelect", "assets/art/hero-garage-select-v1.png");
    this.load.image("campaignMap", "assets/art/namibia-campaign-map-v1.png");
    this.load.image("windhoekLocation", "assets/art/windhoek-location-v1.png");
    this.load.image("heroKiraFull", "assets/characters/full/kira-red-dust-moyo-alpha.png");
    this.load.image("heroFull-nia", "assets/characters/full/nia-trail-kambonde-alpha.png?v=2");
    this.load.image("heroFull-bruno", "assets/characters/full/bruno-cargo-bay-kruger-alpha.png?v=2");
    this.load.image("heroFull-celeste", "assets/characters/full/celeste-hotelowa-ferreira-alpha.png?v=2");
    this.load.image("heroFull-tebo", "assets/characters/full/tebo-gadala-ndlovu-alpha.png?v=2");
    this.load.image("heroFull-mira", "assets/characters/full/mira-migawka-nakamura-alpha.png?v=2");
    this.load.image("heroFull-alex", "assets/characters/full/alex-blysk-carter-alpha.png?v=2");
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
    this.load.image("raceBackdrop", "assets/race/spitzkoppe-rally-backdrop-v1.png?v=2");
    this.load.image("raceVehicleRear", "assets/race/expedition-4x4-rear-v2.png?v=2");
    this.load.image("raceAcacia", "assets/race/roadside-acacia-v1.png?v=2");
    this.load.image("raceOryx", "assets/race/oryx-running-v1.png?v=2");
    this.load.image("raceRocks", "assets/race/road-rocks-v1.png?v=2");
  }

  create(){
    this.prepareBirdTexture();
    this.prepareHeroPortraits();
    const params = new URLSearchParams(window.location.search);
    this.scene.start(params.get("race") === "gravel-crown" ? "RoadRaceScene" : "StartScene");
  }

  prepareHeroPortraits(){
    const portraitCrops = {
      kira: [570, 105, 680, 680],
      nia: [735, 65, 720, 610],
      bruno: [800, 55, 650, 540],
      celeste: [805, 40, 650, 570],
      tebo: [820, 35, 650, 600],
      mira: [510, 95, 500, 650],
      alex: [500, 85, 510, 660]
    };
    HEROES.forEach((hero) => {
      const source = this.textures.get(`heroSheet-${hero.id}`).getSourceImage();
      const crop = portraitCrops[hero.id];
      const portrait = hero.id === "mira" || hero.id === "alex"
        ? { width: 180, height: 250 }
        : { width: 256, height: 256 };
      this.addHeroCropTexture(`heroPortrait-${hero.id}`, source, crop, portrait.width, portrait.height);

    });
  }

  addHeroCropTexture(key, source, crop, width, height){
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    const sourceRatio = crop[2] / crop[3];
    const targetRatio = width / height;
    let sx = crop[0];
    let sy = crop[1];
    let sw = crop[2];
    let sh = crop[3];

    if(sourceRatio > targetRatio){
      sw = crop[3] * targetRatio;
      sx += (crop[2] - sw) / 2;
    }else if(sourceRatio < targetRatio){
      sh = crop[2] / targetRatio;
      sy += (crop[3] - sh) / 2;
    }
    context.imageSmoothingEnabled = true;
    context.drawImage(source, sx, sy, sw, sh, 0, 0, width, height);
    this.textures.addCanvas(key, canvas);
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
