import { WeldingTool } from "./WeldingTool.js";

export class KeyholeWelder extends WeldingTool {
  constructor() {
    super({ name: "Keyhole Welder", range: 14, resourceType: "heat", resourceMax: 100, resourceStart: 0 });
    this.dps = 35;
    this._humOn = false;
  }

  // heat has no "empty" floor gate like ammo does, only the overheat lock matters
  canFire() {
    return !this.locked;
  }

  update(dt, ctx) {
    if (this.locked) {
      this._lockoutTimer -= dt;
      if (this._lockoutTimer <= 0 && this.resource.current < 40) this.locked = false;
    }
    const firingNow = this.isFiring && this.canFire();
    if (firingNow) {
      this.resource.current = Math.min(this.resource.max, this.resource.current + 40 * dt);
      if (!this._humOn) {
        ctx.audioManager.startKeyholeHum();
        this._humOn = true;
      }
      const hit = this._raycastFromCamera(ctx);
      this._fireVisual(ctx, hit, 0x66ffee);
      this._applyHit(hit, dt, ctx, this.dps, false);
      if (this.resource.current >= this.resource.max) {
        this.locked = true;
        this._lockoutTimer = 1.5;
        this.isFiring = false;
        ctx.audioManager.stopKeyholeHum();
        this._humOn = false;
        ctx.audioManager.playOverheatAlarm();
      }
    } else {
      this.resource.current = Math.max(0, this.resource.current - 15 * dt);
      if (this._humOn) {
        ctx.audioManager.stopKeyholeHum();
        this._humOn = false;
      }
    }
  }

  idleRegen(dt) {
    this.resource.current = Math.max(0, this.resource.current - 15 * dt);
    if (this.locked) {
      this._lockoutTimer -= dt;
      if (this._lockoutTimer <= 0 && this.resource.current < 40) this.locked = false;
    }
    if (this._humOn) {
      this.isFiring = false;
    }
  }
}
