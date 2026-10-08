import * as THREE from "three";
import { NPCBase } from "./NPCBase.js";

const FOLLOW_STOP_DISTANCE = 2.5;
const SCAN_INTERVAL = 0.3;
const SCAN_RADIUS = 6;
const ATTACK_LEASH_RANGE = 7;
const ATTACK_DPS = 10;
const BEAM_FX_CHANCE = 0.1;

export class EngineerAlly extends NPCBase {
  constructor(scene, position) {
    super({
      type: "ally",
      isHostile: false,
      position,
      speed: 5,
      maxHp: 80,
      halfWidth: 0.4,
      height: 1.8,
      flies: false,
    });

    this._target = null;
    this._scanTimer = 0;

    const group = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2e,
      emissive: 0x44ddaa,
      emissiveIntensity: 0.7,
      metalness: 0.4,
      roughness: 0.5,
    });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 1.0, 4, 8), bodyMat);
    body.position.y = 0.9;
    group.add(body);

    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0x44ddaa,
      emissive: 0x44ddaa,
      emissiveIntensity: 1.5,
      metalness: 0.2,
      roughness: 0.3,
    });
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), eyeMat);
    eye.position.set(0, 1.45, 0.3);
    group.add(eye);

    this.mesh = group;
    scene.add(this.mesh);
  }

  _updateState(dt, ctx) {
    switch (this.state) {
      case "idle":
        this.setState("follow");
        break;

      case "follow": {
        const d = this._seekTowards(ctx.player.position, this.speed);
        if (d < FOLLOW_STOP_DISTANCE) {
          this.velocity.x = 0;
          this.velocity.z = 0;
        }
        this._applyMovement(dt, ctx);

        this._scanTimer -= dt;
        if (this._scanTimer <= 0) {
          this._scanTimer = SCAN_INTERVAL;
          const found = ctx.npcManager.findNearestHostile(this.position, SCAN_RADIUS, null);
          if (found) {
            this._target = found;
            this.setState("attack");
          }
        }
        break;
      }

      case "attack": {
        if (!this._target || !this._target.alive) {
          this._target = null;
          this.setState("follow");
          break;
        }
        const d = this._distanceTo(this._target.position);
        if (d > ATTACK_LEASH_RANGE) {
          this._target = null;
          this.setState("follow");
          break;
        }
        this.velocity.x = 0;
        this.velocity.z = 0;
        this._applyMovement(dt, ctx);
        this.facing = Math.atan2(
          this._target.position.x - this.position.x,
          this._target.position.z - this.position.z
        );
        if (this.hasLineOfSightTo(this._target.position, ctx.level)) {
          this._target.takeDamage(ATTACK_DPS * dt);
          if (Math.random() < BEAM_FX_CHANCE) {
            ctx.particleSystem.spawnLine(this.getEyePosition(), this._target.position, 0x44ddaa, 0.1);
          }
        }
        break;
      }
    }
  }
}
