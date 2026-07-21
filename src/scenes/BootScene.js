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
      return red > 210 && green > 210 && blue > 210 && Math.max(red, green, blue) - Math.min(red, green, blue) < 24;
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

    context.putImageData(image, 0, 0);
    this.textures.addCanvas("startVehicleAlpha", canvas);
  }
}
