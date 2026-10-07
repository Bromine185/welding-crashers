import * as THREE from "three";
import { NPCBase } from "./NPCBase.js";

const BARK_COOLDOWN_MIN = 15;
const BARK_COOLDOWN_RANGE = 10;

export class CaptainNPC extends NPCBase {
  constructor(scene, position, hud, audioManager) {
    super({
      type: "captain",
      isHostile: false,
      position,
      speed: 0,
      maxHp: 999,
      halfWidth: 0.4,
      height: 1.8,
      flies: false,
    });

    this.hud = hud;
    this.audioManager = audioManager;

    const group = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2e,
      emissive: 0x6699ff,
      emissiveIntensity: 0.7,
      metalness: 0.4,
      roughness: 0.5,
    });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 1.0, 4, 8), bodyMat);
    body.position.y = 0.9;
    group.add(body);

    const headMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x6699ff,
      emissiveIntensity: 1.2,
      metalness: 0.2,
      roughness: 0.3,
    });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), headMat);
    head.position.set(0, 1.55, 0);
    group.add(head);

    const insigniaMat = new THREE.MeshStandardMaterial({
      color: 0x6699ff,
      emissive: 0x6699ff,
      emissiveIntensity: 1.5,
      metalness: 0.2,
      roughness: 0.3,
    });
    const insignia = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.05), insigniaMat);
    insignia.position.set(0, 1.1, 0.33);
    group.add(insignia);

    this.mesh = group;
    scene.add(this.mesh);

    this._barkTimer = 6 + Math.random() * 6;
    this._idleLines = [
      "Hold the line, engineer.",
      "Watch for the saboteur in Engineering.",
      "Seal those breaches before we lose atmo.",
      "This old girl has seen worse than this.",
    ];
  }

  _updateState(dt, ctx) {
    this._barkTimer -= dt;
    if (this._barkTimer <= 0) {
      this._barkTimer = BARK_COOLDOWN_MIN + Math.random() * BARK_COOLDOWN_RANGE;
      this.sayLine(this._idleLines[Math.floor(Math.random() * this._idleLines.length)]);
    }
  }

  takeDamage(amount) {
    // invulnerable: the Captain is never a combat participant
  }

  sayLine(text) {
    if (this.hud) this.hud.showSubtitle(text, 3);
    if (this.audioManager) this.audioManager.playAllyBark();
  }
}
