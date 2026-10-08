import * as THREE from "three";
import { NPCBase } from "./NPCBase.js";

export class HullBreachDrone extends NPCBase {
  constructor(scene, position) {
    super({ type: "drone", isHostile: true, position, speed: 4, maxHp: 30, halfWidth: 0.35, height: 0.6, flies: true });

    const geometry = new THREE.IcosahedronGeometry(0.35, 0);
    const material = new THREE.MeshStandardMaterial({
      color: 0x662211,
      emissive: 0xff4433,
      emissiveIntensity: 1,
      roughness: 0.4,
      metalness: 0.6,
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(position.x, position.y, position.z);

    const glow = new THREE.PointLight(0xff3300, 1.5, 3);
    glow.position.set(0, 0, 0);
    this.mesh.add(glow);

    scene.add(this.mesh);

    this._attackCooldown = 0;
    this._routeName = "cargoLoop";
  }

  _updateState(dt, ctx) {
    this._attackCooldown -= dt;

    switch (this.state) {
      case "idle":
        this.setState("patrol");
        break;

      case "patrol":
        this._waypointFollow(ctx.level.patrolRoutes[this._routeName], this.speed);
        this._losTimer -= dt;
        if (this._losTimer <= 0) {
          this._losTimer = 0.25;
          const d = this._distanceTo(ctx.player.position);
          if (d <= 10 && this.hasLineOfSightTo(ctx.player.position, ctx.level)) this.setState("alert");
        }
        this._applyMovement(dt, ctx);
        break;

      case "alert":
        this.velocity.x = 0;
        this.velocity.z = 0;
        if (this.stateTimer > 0.4) this.setState("chase");
        break;

      case "chase": {
        const d = this._seekTowards(ctx.player.position, this.speed * 1.2);
        if (d <= 1.4) this.setState("attack");
        else if (!this.hasLineOfSightTo(ctx.player.position, ctx.level) && this.stateTimer > 4) this.setState("patrol");
        this._applyMovement(dt, ctx);
        break;
      }

      case "attack": {
        const d = this._distanceTo(ctx.player.position);
        this._seekTowards(ctx.player.position, this.speed);
        this._applyMovement(dt, ctx);
        if (d > 1.6) {
          this.setState("chase");
          break;
        }
        if (this._attackCooldown <= 0) {
          ctx.player.takeDamage(10);
          this._attackCooldown = 1.2;
          ctx.particleSystem.spawnSparks(this.position, null, { color: 0xff4433, count: 8 });
          ctx.audioManager.playImpact();
        }
        break;
      }
    }
  }
}
