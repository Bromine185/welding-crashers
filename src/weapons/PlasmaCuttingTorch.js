import { WeldingTool } from "./WeldingTool.js";

export class PlasmaCuttingTorch extends WeldingTool {
  constructor() {
    super({ name: "Plasma Cutting Torch", range: 3, resourceType: "fuel", resourceMax: 50, resourceStart: 50 });
    this.dps = 60;
    this.cutRate = 40;
  }

  canFire() {
    return this.resource.current > 0;
  }

  update(dt, ctx) {
    if (this.isFiring && this.canFire()) {
      this.resource.current = Math.max(0, this.resource.current - 25 * dt);
      const hit = this._raycastFromCamera(ctx);
      this._fireVisual(ctx, hit, 0xffa033);
      if (hit) {
        if (hit.kind === "npc") {
          this._applyHit(hit, dt, ctx, this.dps, false);
          ctx.audioManager.playImpact();
        } else if (hit.kind === "door") {
          this._applyHit(hit, dt, ctx, this.cutRate, false);
        } else if (hit.kind === "breach") {
          // registerWeldHit advances repair at a fixed internal rate keyed on dt alone;
          // the amount passed here is unused for breach hits, so its exact value doesn't matter.
          this._applyHit(hit, dt, ctx, 0.2 * 5, false);
        } else {
          this._applyHit(hit, dt, ctx, 0, false);
        }
      }
      this._burstAccum = (this._burstAccum || 0) + dt;
      if (this._burstAccum >= 0.2) {
        this._burstAccum = 0;
        ctx.audioManager.playPlasmaBurst();
      }
    } else {
      this.idleRegen(dt);
    }
  }

  idleRegen(dt) {
    this.resource.current = Math.min(this.resource.max, this.resource.current + 5 * dt);
  }
}
