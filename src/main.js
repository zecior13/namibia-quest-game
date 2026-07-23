import { BootScene } from "./scenes/BootScene.js";
import { StartScene } from "./scenes/StartScene.js?v=6";
import { HeroSelectScene } from "./scenes/HeroSelectScene.js?v=6";
import { MapScene } from "./scenes/MapScene.js?v=6";
import { WindhoekScene } from "./scenes/WindhoekScene.js";
import { GearScene } from "./scenes/GearScene.js";
import { PackScene } from "./scenes/PackScene.js";
import { RoadRaceScene } from "./scenes/RoadRaceScene.js?v=12";

const config = {
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#102b3f",
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 390,
    height: 844
  },
  input: {
    activePointers: 3
  },
  scene: [
    BootScene,
    StartScene,
    HeroSelectScene,
    MapScene,
    WindhoekScene,
    GearScene,
    PackScene,
    RoadRaceScene
  ]
};

new Phaser.Game(config);
