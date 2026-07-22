import { BaseScene } from "./BaseScene.js";
import { HEROES } from "../data/heroes.js";

export class WindhoekScene extends BaseScene {
  constructor(){
    super("WindhoekScene");
  }

  create(){
    this.save = this.getSave();
    this.drawLocationArtwork();
    this.drawChapterHeader();
    this.drawHeroIdentity();
    this.drawActivities();
    this.drawMapExit();
    this.cameras.main.fadeIn(280, 9, 15, 17);
  }

  drawLocationArtwork(){
    const artwork = this.add.image(this.W / 2, this.H / 2, "windhoekLocation");
    artwork.setDisplaySize(this.W, this.H);

    const shade = this.add.graphics();
    shade.fillGradientStyle(0x071016, 0x071016, 0x071016, 0x071016, 0.67, 0.05, 0.02, 0.63);
    shade.fillRect(0, 0, this.W, 170);
    shade.fillGradientStyle(0x071016, 0x071016, 0x071016, 0x071016, 0.0, 0.0, 0.68, 0.84);
    shade.fillRect(0, this.H - 174, this.W, 174);
  }

  drawChapterHeader(){
    this.add.text(20, 20, "ETAP 1 · WINDHOEK", {
      fontFamily: "Georgia", fontSize: "11px", fontStyle: "bold", color: "#d2aa63", letterSpacing: 2,
      shadow: { offsetY: 2, color: "#090604", blur: 3, fill: true }
    });
    this.add.text(20, 42, "Ostatnie przygotowania", {
      fontFamily: "Georgia", fontSize: "25px", fontStyle: "bold", color: "#fff0c8",
      shadow: { offsetY: 3, color: "#090604", blur: 5, fill: true }
    });
    this.add.text(20, 78, "Zanim ruszysz na południe, przygotuj bohatera\ni spakuj samochód na pustynną drogę.", {
      fontFamily: "Georgia", fontSize: "11px", color: "#ead9b8", lineSpacing: 3,
      shadow: { offsetY: 2, color: "#090604", blur: 3, fill: true }
    });
  }

  drawHeroIdentity(){
    const hero = HEROES.find((entry) => entry.id === this.save.heroId) || HEROES[0];
    const portrait = this.add.image(this.W - 39, 38, `heroPortrait-${hero.id}`).setDisplaySize(42, 42);
    const frame = this.add.graphics();
    frame.lineStyle(2, 0xd6b26d, 0.94);
    frame.strokeRect(this.W - 61, 16, 44, 44);
    portrait.setInteractive({ useHandCursor: true }).on("pointerdown", () => this.showMessage(
      `${this.save.heroName || hero.name.split(" ")[0]} · ${hero.role}`
    ));
  }

  drawActivities(){
    const gearDone = this.save.gearComplete === true || (this.save.gear || []).length === 5;
    const packDone = this.save.packComplete === true;

    this.addActivityBeacon({
      x: 24,
      y: this.H - 304,
      width: 174,
      number: "1",
      title: "WYPOSAŻ BOHATERA",
      subtitle: gearDone ? "PRZYGOTOWANE" : "5 MIEJSC NA SPRZĘT",
      completed: gearDone,
      callback: () => this.scene.start("GearScene")
    });

    this.addActivityBeacon({
      x: this.W - 182,
      y: this.H - 408,
      width: 164,
      number: "2",
      title: "SPAKUJ 4x4",
      subtitle: packDone ? "SAMOCHÓD GOTOWY" : gearDone ? "BAGAŻNIK CZEKA" : "NAJPIERW SPRZĘT",
      completed: packDone,
      locked: !gearDone,
      callback: () => {
        if(!gearDone){
          this.showMessage("Najpierw wybierz pięć elementów wyposażenia.");
          return;
        }
        this.scene.start("PackScene");
      }
    });

    if(gearDone && packDone){
      this.addDepartureAction();
    }else{
      this.add.text(this.W / 2, this.H - 70, `${Number(gearDone) + Number(packDone)} / 2 PRZYGOTOWANIA`, {
        fontFamily: "Georgia", fontSize: "10px", fontStyle: "bold", color: "#d8bf8d", letterSpacing: 1,
        shadow: { offsetY: 2, color: "#090604", blur: 3, fill: true }
      }).setOrigin(0.5);
    }
  }

  addActivityBeacon({ x, y, width, number, title, subtitle, completed = false, locked = false, callback }){
    const height = 50;
    const group = this.add.container(x, y);
    const plate = this.add.graphics();
    plate.fillStyle(locked ? 0x202a2b : 0x132d32, locked ? 0.78 : 0.94);
    plate.fillRect(0, 0, width, height);
    plate.lineStyle(2, completed ? 0x9fbc82 : 0xc29551, locked ? 0.45 : 0.92);
    plate.strokeRect(1, 1, width - 2, height - 2);

    const medallion = this.add.graphics();
    medallion.fillStyle(completed ? 0x355c50 : locked ? 0x4a493e : 0xa35f32, 1);
    medallion.fillCircle(25, height / 2, 15);
    medallion.lineStyle(2, 0xe2c47d, locked ? 0.5 : 0.92);
    medallion.strokeCircle(25, height / 2, 15);
    if(completed){
      medallion.lineStyle(2, 0xf0dda6, 1);
      medallion.lineBetween(19, 25, 23, 29);
      medallion.lineBetween(23, 29, 31, 20);
    }

    const numberText = completed ? null : this.add.text(25, height / 2, number, {
      fontFamily: "Georgia", fontSize: "12px", fontStyle: "bold", color: "#f5dfaa"
    }).setOrigin(0.5);
    const titleText = this.add.text(48, 10, title, {
      fontFamily: "Georgia", fontSize: "10px", fontStyle: "bold", color: locked ? "#a89d87" : "#f4dfb1",
      letterSpacing: 1
    });
    const subtitleText = this.add.text(48, 29, subtitle, {
      fontFamily: "Georgia", fontSize: "8px", fontStyle: "bold", color: completed ? "#a8c49d" : "#c89b56"
    });

    const hitArea = this.add.rectangle(width / 2, height / 2, width, height, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    group.add([plate, medallion, titleText, subtitleText, hitArea]);
    if(numberText) group.add(numberText);
    hitArea.on("pointerdown", () => {
      group.setScale(0.98);
      callback();
    });
    hitArea.on("pointerup", () => group.setScale(1));
    hitArea.on("pointerout", () => group.setScale(1));

    if(!locked && !completed){
      this.tweens.add({ targets: group, alpha: 0.86, duration: 820, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    }
  }

  addDepartureAction(){
    const x = 92;
    const y = this.H - 80;
    const width = this.W - 112;
    const height = 42;
    const group = this.add.container(x, y);
    const plate = this.add.graphics();
    plate.fillStyle(0x9d592d, 0.98);
    plate.fillRect(0, 0, width, height);
    plate.lineStyle(2, 0xe0bf72, 0.98);
    plate.strokeRect(1, 1, width - 2, height - 2);
    const text = this.add.text(width / 2, height / 2, "RUSZAJ DO SOLITAIRE", {
      fontFamily: "Georgia", fontSize: "12px", fontStyle: "bold", color: "#fff0c5", letterSpacing: 1
    }).setOrigin(0.5);
    const hitArea = this.add.rectangle(width / 2, height / 2, width, height, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    group.add([plate, text, hitArea]);
    hitArea.on("pointerdown", () => {
      this.saveGamePatch({ windhoekDone: true, progress: "solitaire", mapStage: "solitaire" });
      this.scene.start("MapScene");
    });
  }

  drawMapExit(){
    const x = 14;
    const y = this.H - 80;
    const width = 66;
    const height = 42;
    const group = this.add.container(x, y);
    const plate = this.add.graphics();
    plate.fillStyle(0x132a32, 0.92);
    plate.fillRect(0, 0, width, height);
    plate.lineStyle(1, 0xb99354, 0.84);
    plate.strokeRect(0, 0, width, height);
    const text = this.add.text(width / 2, height / 2, "MAPA", {
      fontFamily: "Georgia", fontSize: "10px", fontStyle: "bold", color: "#ead09a", letterSpacing: 1
    }).setOrigin(0.5);
    const hitArea = this.add.rectangle(width / 2, height / 2, width, height, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    group.add([plate, text, hitArea]);
    hitArea.on("pointerdown", () => this.scene.start("MapScene"));
  }

  showMessage(message){
    if(this.messageLayer) this.messageLayer.destroy(true);
    const group = this.add.container(this.W / 2, this.H - 132).setDepth(20);
    const background = this.add.graphics();
    background.fillStyle(0x101f23, 0.96);
    background.fillRect(-160, -23, 320, 46);
    background.lineStyle(1, 0xc19753, 0.9);
    background.strokeRect(-160, -23, 320, 46);
    const text = this.add.text(0, 0, message, {
      fontFamily: "Georgia", fontSize: "10px", fontStyle: "bold", color: "#f0ddb8", align: "center",
      wordWrap: { width: 290 }
    }).setOrigin(0.5);
    group.add([background, text]);
    this.messageLayer = group;
    this.time.delayedCall(1900, () => {
      if(this.messageLayer === group){
        group.destroy(true);
        this.messageLayer = null;
      }
    });
  }
}
