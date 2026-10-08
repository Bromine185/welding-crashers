import * as THREE from "three";
import { NPCBase } from "./NPCBase.js";

export class CorrodedSentryTurret extends NPCBase {
  constructor(scene, position) {
    super({ type: "turret", isHostile: true, position, speed: 0, maxHp: 50, halfWidth: 0.5, height: 0.8, flies: true });

    const baseWidth = 0.9;
    const baseHeight = 0.5;
    const baseDepth = 0.9;
    const baseGeometry = new THREE.BoxGeometry(baseWidth, baseHeight, baseDepth);
    baseGeometry.translate(0, baseHeight / 2, 0);
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a4038,
      emissive: 0xcc2222,
      emissiveIntensity: 0.5,
      roughness: 0.8,
      metalness: 0.5,
    });
    this.mesh = new THREE.Mesh(baseGeometry, baseMaterial);

    const barrelLength = 0.9;
    const barrelRadius = 0.12;
    const barrelGeometry = new THREE.CylinderGeometry(barrelRadius, barrelRadius, barrelLength, 8);
    barrelGeometry.rotateX(Math.PI / 2);
    const barrelMaterial = new THREE.MeshStandardMaterial({
      color: 0x2e2a26,
      emissive: 0xcc2222,
      emissiveIntensity: 0.8,
      roughness: 0.6,
      metalness: 0.7,
    });
    this.barrelMesh = new THREE.Mesh(barrelGeometry, barrelMaterial);
    this.barrelMesh.position.set(0, baseHeight * 0.75, barrelLength / 2 - 0.1);
    this.mesh.add(this.barrelMesh);

    this.mesh.position.set(position.x, position.y, position.z);
    scene.add(this.mesh);

    this._attackCooldown = 0;
  }

  _updateState(dt, ctx) {
    switch (this.state) {
      case "idle":
        this._losTimer -= dt;
        if (this._losTimer <= 0) {
          this._losTimer = 0.3;
          const d = this._distanceTo(ctx.player.position);
          if (d <= 15 && this.hasLineOfSightTo(ctx.player.position, ctx.level)) this.setState("attack");
        }
        break;

      case "attack": {
        const d = this._distanceTo(ctx.player.position);
        const los = this.hasLineOfSightTo(ctx.player.position, ctx.level);
        if (d > 15 || !los) {
          if (this.stateTimer > 2) this.setState("idle");
          break;
        }
        this.facing = Math.atan2(ctx.player.position.x - this.position.x, ctx.player.position.z - this.position.z);
        this._attackCooldown -= dt;
        if (this._attackCooldown <= 0) {
          ctx.player.takeDamage(8);
          this._attackCooldown = 0.8;
          ctx.particleSystem.spawnLine(this.getEyePosition(), ctx.player.position, 0xff3333, 0.1);
          ctx.audioManager.playArcZap();
        }
        break;
      }
    }
  }
}
