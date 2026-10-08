import { WeldingTool } from "./WeldingTool.js";

export class ArcWelder extends WeldingTool {
  constructor() {
    super({ name: "Arc Welder", range: 8, resourceType: "wireFeed", resourceMax: 20, resourceStart: 20 });
    this._shotCooldown = 0;
    this.chainRadius = 4;
  }

  canFire() {
    return this.resource.current >= 1;
  }

  update(dt, ctx) {
    this._shotCooldown -= dt;
    if (this.isFiring && this.canFire() && this._shotCooldown <= 0) {
      this._shotCooldown = 0.25;
      this.resource.current -= 1;
      ctx.audioManager.playArcZap();
      const hit = this._raycastFromCamera(ctx);
      this._fireVisual(ctx, hit, 0x3fd0ff);
      if (hit) {
        if (hit.kind === "npc") {
          this._applyHit(hit, dt, ctx, 25, true);
          const second = ctx.npcManager.findNearestHostile(hit.point, this.chainRadius, hit.item.npc);
          if (second) {
            second.takeDamage(12);
            ctx.particleSystem.spawnLine(hit.point, second.position, 0x66ddff, 0.15);
            ctx.particleSystem.spawnSparks(second.position, null, { color: 0x66ddff, count: 6 });
          }
        } else {
          this._applyHit(hit, dt, ctx, 25, true);
        }
      }
    } else if (!this.isFiring) {
      this.idleRegen(dt);
    }
  }

  idleRegen(dt) {
    this._regenAccum = (this._regenAccum || 0) + dt;
    if (this._regenAccum >= 3) {
      this._regenAccum -= 3;
      this.resource.current = Math.min(this.resource.max, this.resource.current + 1);
    }
  }
}
