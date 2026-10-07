import * as THREE from "three";
import { NPCBase } from "./NPCBase.js";

const ATTACK_RANGE = 6;
const DETECT_RANGE = 10;
const DETECT_INTERVAL = 0.25;
const ALERT_REACTION_TIME = 0.3;
const IDLE_SETTLE_TIME = 0.5;

export class Saboteur extends NPCBase {
  constructor(scene, position) {
    super({
      type: "saboteur",
      isHostile: true,
      position,
      speed: 3.5,
      maxHp: 60,
      halfWidth: 0.4,
      height: 1.8,
      flies: false,
    });

    this._attackCooldown = 0;
    this._routeName = "engineeringLoop";
    this._detectTimer = 0;

    const group = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2e,
      emissive: 0xcc3322,
      emissiveIntensity: 0.7,
      metalness: 0.4,
      roughness: 0.5,
    });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 1.0, 4, 8), bodyMat);
    body.position.y = 0.9;
    group.add(body);

    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0xff4433,
      emissive: 0xff4433,
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
    this._attackCooldown -= dt;

    switch (this.state) {
      case "idle": {
        this.velocity.x = 0;
        this.velocity.z = 0;
        this._applyMovement(dt, ctx);
        if (this.stateTimer > IDLE_SETTLE_TIME) this.setState("patrol");
        break;
      }

      case "patrol": {
        this._waypointFollow(ctx.level.patrolRoutes[this._routeName], this.speed);
        this._applyMovement(dt, ctx);
        this._checkDetection(dt, ctx);
        break;
      }

      case "alert": {
        this.velocity.x = 0;
        this.velocity.z = 0;
        this._applyMovement(dt, ctx);
        this.facing = Math.atan2(
          ctx.player.position.x - this.position.x,
          ctx.player.position.z - this.position.z
        );
        if (this.stateTimer > ALERT_REACTION_TIME) this.setState("chase");
        break;
      }

      case "chase": {
        const dist = this._seekTowards(ctx.player.position, this.speed);
        this._applyMovement(dt, ctx);
        const los = this.hasLineOfSightTo(ctx.player.position, ctx.level);
        if (dist <= ATTACK_RANGE && los) {
          this.setState("attack");
        } else if (!los && this.stateTimer > 4) {
          this.setState("patrol");
        }
        break;
      }

      case "attack": {
        this.velocity.x = 0;
        this.velocity.z = 0;
        this._applyMovement(dt, ctx);
        const distance = this._distanceTo(ctx.player.position);
        this.facing = Math.atan2(
          ctx.player.position.x - this.position.x,
          ctx.player.position.z - this.position.z
        );
        const los = this.hasLineOfSightTo(ctx.player.position, ctx.level);
        if (this._attackCooldown <= 0 && distance <= ATTACK_RANGE && los) {
          ctx.player.takeDamage(15);
          this._attackCooldown = 1.2;
          ctx.particleSystem.spawnLine(this.getEyePosition(), ctx.player.position, 0xff6622, 0.12);
          ctx.audioManager.playArcZap();
        }
        if (distance > 7 || (!los && this.stateTimer > 2)) {
          this.setState("chase");
        }
        break;
      }
    }
  }

  _checkDetection(dt, ctx) {
    this._detectTimer -= dt;
    if (this._detectTimer > 0) return;
    this._detectTimer = DETECT_INTERVAL;
    const dist = this._distanceTo(ctx.player.position);
    if (dist <= DETECT_RANGE && this.hasLineOfSightTo(ctx.player.position, ctx.level)) {
      this.setState("alert");
    }
  }
}
