import * as THREE from "three";
import { createComposer } from "./PostFX.js";
import { InputManager } from "./InputManager.js";
import { AudioManager } from "./AudioManager.js";
import { Level } from "../world/Level.js";
import { Starfield } from "../world/Starfield.js";
import { ParticleSystem } from "../vfx/ParticleSystem.js";
import { PlayerController } from "../player/PlayerController.js";
import { NPCManager } from "../npc/NPCManager.js";
import { HullBreachDrone } from "../npc/HullBreachDrone.js";
import { Saboteur } from "../npc/Saboteur.js";
import { CorrodedSentryTurret } from "../npc/CorrodedSentryTurret.js";
import { EngineerAlly } from "../npc/EngineerAlly.js";
import { MedicBot } from "../npc/MedicBot.js";
import { CaptainNPC } from "../npc/CaptainNPC.js";
import { WeaponSystem } from "../weapons/WeaponSystem.js";
import { ObjectiveManager } from "../objectives/ObjectiveManager.js";
import { HUD } from "../ui/HUD.js";

const CAPTAIN_INTERACT_RANGE = 3;

export class Game {
  constructor() {
    this.viewportDiv = document.getElementById("viewport");

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.viewportDiv.appendChild(this.renderer.domElement);

    const { composer } = createComposer(this.renderer, this.scene, this.camera);
    this.composer = composer;

    this.input = new InputManager(this.viewportDiv);
    this.audioManager = new AudioManager();
    this.level = new Level(this.scene);
    this.starfield = new Starfield(this.scene);
    this.particleSystem = new ParticleSystem(this.scene);
    this.player = new PlayerController(this.camera, this.input, this.level);
    this.npcManager = new NPCManager();
    this.weaponSystem = new WeaponSystem();
    this.objectiveManager = new ObjectiveManager(this.level);
    this.hud = new HUD();

    this.npcManager.add(new HullBreachDrone(this.scene, this.level.spawnPoints.drone1));
    this.npcManager.add(new HullBreachDrone(this.scene, this.level.spawnPoints.drone2));
    this.npcManager.add(new Saboteur(this.scene, this.level.spawnPoints.saboteur));
    this.npcManager.add(new CorrodedSentryTurret(this.scene, this.level.spawnPoints.turret));
    this.npcManager.add(new EngineerAlly(this.scene, this.level.spawnPoints.ally));
    this.npcManager.add(new MedicBot(this.scene, this.level.spawnPoints.medic));

    const captain = new CaptainNPC(this.scene, this.level.spawnPoints.captain, this.hud, this.audioManager);
    this.npcManager.add(captain);
    this.objectiveManager.setCaptain(captain);

    this.state = "start";
    this.clock = new THREE.Clock();

    this.hud.onStart(() => {
      this.audioManager.resume();
      this.input.requestPointerLock();
      this.state = "playing";
      this.clock.start();
    });
    this.hud.onRestart(() => window.location.reload());

    window.addEventListener("resize", () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.composer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  start() {
    requestAnimationFrame(this.loop.bind(this));
  }

  loop(ts) {
    requestAnimationFrame(this.loop.bind(this));
    const dt = Math.min(this.clock.getDelta(), 0.1);
    if (this.state === "playing") this.update(dt);
    this.composer.render();
  }

  update(dt) {
    this.input.update();

    const ctx = {
      dt,
      camera: this.camera,
      player: this.player,
      level: this.level,
      npcManager: this.npcManager,
      weaponSystem: this.weaponSystem,
      particleSystem: this.particleSystem,
      audioManager: this.audioManager,
      objectiveManager: this.objectiveManager,
      input: this.input,
    };

    this.player.update(dt, ctx);
    this.weaponSystem.update(dt, ctx);
    if (this.weaponSystem.consumeHitThisFrame()) this.hud.showHitMarker();
    this.npcManager.update(dt, ctx);
    this.level.update(dt);
    this.starfield.update(dt);
    this.particleSystem.update(dt);

    const captain = this.npcManager.getAll().find((n) => n.type === "captain");
    if (captain) {
      const d = Math.hypot(
        captain.position.x - this.player.position.x,
        captain.position.y - this.player.position.y,
        captain.position.z - this.player.position.z
      );
      if (d < CAPTAIN_INTERACT_RANGE) {
        this.hud.showInteractPrompt("Press E to talk to the Captain");
        if (this.input.justPressed("KeyE")) captain.sayLine(this._pickCaptainLine ? this._pickCaptainLine() : "Hold the line, engineer.");
      } else {
        this.hud.hideInteractPrompt();
      }
    }

    this.hud.update({
      hp: this.player.hp,
      maxHp: this.player.maxHp,
      weapon: this.weaponSystem.getHUDData(),
      objectivesRepaired: this.objectiveManager.repairedCount(),
      objectivesTotal: this.objectiveManager.total,
    });

    if (this.player.hp <= 0) this.triggerGameOver(false);
    else if (this.objectiveManager.checkWinCondition(this.npcManager)) this.triggerGameOver(true);
  }

  triggerGameOver(won) {
    if (this.state !== "playing") return;
    this.state = won ? "won" : "lost";
    try {
      document.exitPointerLock();
    } catch (e) {}
    this.hud.showGameOverScreen(won);
  }
}
