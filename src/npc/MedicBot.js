import * as THREE from "three";
import { NPCBase } from "./NPCBase.js";

export class MedicBot extends NPCBase {
  constructor(scene, position) {
    super({
      type: "medic",
      isHostile: false,
      position,
      speed: 4.5,
      maxHp: 40,
      halfWidth: 0.3,
      height: 0.5,
      flies: true,
    });

    const body = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.3, 0),
      new THREE.MeshStandardMaterial({
        color: 0x224433,
        emissive: 0x66ffaa,
        emissiveIntensity: 1.1,
        metalness: 0.3,
        roughness: 0.4,
      })
    );

    const glow = new THREE.PointLight(0x66ffaa, 1, 3);
    glow.position.set(0, 0, 0);
    body.add(glow);

    this.mesh = body;
    scene.add(this.mesh);
  }

  _updateState(dt, ctx) {
    switch (this.state) {
      case "idle":
        this.setState("follow");
        break;
      case "follow": {
        const d = this._distanceTo(ctx.player.position);
        if (d > 3) {
          this._seekTowards(ctx.player.position, this.speed);
        } else if (d < 2) {
          this._seekTowards(ctx.player.position, -this.speed * 0.5);
        } else {
          this.velocity.x = 0;
          this.velocity.z = 0;
        }
        this.position.y = ctx.player.position.y + 1.6 + Math.sin(this.stateTimer * 2) * 0.1;
        this._applyMovement(dt, ctx);
        if (ctx.player.hp < ctx.player.maxHp && d <= 3) this.setState("heal");
        break;
      }
      case "heal": {
        const d = this._distanceTo(ctx.player.position);
        if (d > 3.5 || ctx.player.hp >= ctx.player.maxHp) {
          this.setState("follow");
          break;
        }
        this._seekTowards(ctx.player.position, d > 2.5 ? this.speed * 0.6 : 0);
        this.position.y = ctx.player.position.y + 1.6;
        this._applyMovement(dt, ctx);
        ctx.player.heal(5 * dt);
        if (Math.floor(this.stateTimer * 4) !== Math.floor((this.stateTimer - dt) * 4)) {
          ctx.particleSystem.spawnLine(
            this.position,
            { x: ctx.player.position.x, y: ctx.player.position.y + 1.4, z: ctx.player.position.z },
            0x66ffaa,
            0.12
          );
        }
        break;
      }
    }
  }
}
