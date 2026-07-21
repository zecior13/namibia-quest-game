export class BootScene extends Phaser.Scene {
  constructor(){
    super("BootScene");
  }

  preload(){
    this.load.image("titleMap", "assets/art/title-map-style-a.png");
    this.load.image("startScene", "assets/art/start-scene-namibia.png");
    this.load.image("startPlate", "assets/art/start-scene-plate.png");
    this.load.image("startVehicle", "assets/art/start-scene-vehicle.png");
    this.load.image("heroDriver", "assets/art/hero-driver-kapitan-4x4.png");
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
    this.prepareTransparentVehicle();
    this.prepareBirdTexture();
    this.scene.start("StartScene");
  }

  prepareTransparentVehicle(){
    const source = this.textures.get("startVehicle").getSourceImage();
    const canvas = document.createElement("canvas");
    canvas.width = source.width;
    canvas.height = source.height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(source, 0, 0);

    const image = context.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = image.data;
    const visited = new Uint8Array(canvas.width * canvas.height);
    const queue = [];
    const indexFor = (x, y) => y * canvas.width + x;
    const isBackdrop = (x, y) => {
      const offset = indexFor(x, y) * 4;
      const red = pixels[offset];
      const green = pixels[offset + 1];
      const blue = pixels[offset + 2];
      return red > 165 && green > 165 && blue > 165 && Math.max(red, green, blue) - Math.min(red, green, blue) < 35;
    };

    for(let x = 0; x < canvas.width; x++){
      queue.push([x, 0], [x, canvas.height - 1]);
    }
    for(let y = 1; y < canvas.height - 1; y++){
      queue.push([0, y], [canvas.width - 1, y]);
    }

    while(queue.length){
      const [x, y] = queue.pop();
      if(x < 0 || y < 0 || x >= canvas.width || y >= canvas.height){
        continue;
      }
      const position = indexFor(x, y);
      if(visited[position] || !isBackdrop(x, y)){
        continue;
      }
      visited[position] = 1;
      pixels[position * 4 + 3] = 0;
      queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }

    // The checkerboard also forms enclosed pockets beneath the vehicle.
    // Remove only very bright neutral pixels so the illustrated paint and bags remain intact.
    for(let offset = 0; offset < pixels.length; offset += 4){
      const red = pixels[offset];
      const green = pixels[offset + 1];
      const blue = pixels[offset + 2];
      if(red > 220 && green > 220 && blue > 220 && Math.max(red, green, blue) - Math.min(red, green, blue) < 35){
        pixels[offset + 3] = 0;
      }
    }

    context.putImageData(image, 0, 0);
    this.textures.addCanvas("startVehicleAlpha", canvas);
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
