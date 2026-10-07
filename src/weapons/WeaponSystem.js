import { KeyholeWelder } from "./KeyholeWelder.js";
import { ArcWelder } from "./ArcWelder.js";
import { PlasmaCuttingTorch } from "./PlasmaCuttingTorch.js";

export class WeaponSystem {
  constructor() {
    this.tools = [new KeyholeWelder(), new ArcWelder(), new PlasmaCuttingTorch()];
    this.currentIndex = 0;
  }

  current() {
    return this.tools[this.currentIndex];
  }

  switchTo(i) {
    if (i < 0 || i >= this.tools.length || i === this.currentIndex) return;
    this.current().stopFire();
    this.currentIndex = i;
  }

  update(dt, ctx) {
    if (ctx.input.justPressed("Digit1")) this.switchTo(0);
    if (ctx.input.justPressed("Digit2")) this.switchTo(1);
    if (ctx.input.justPressed("Digit3")) this.switchTo(2);
    if (ctx.input.isLeftMouseDown()) this.current().startFire();
    else this.current().stopFire();
    this.current().hitThisFrame = false;
    this.current().update(dt, ctx);
    this.tools.forEach((t, i) => {
      if (i !== this.currentIndex) t.idleRegen(dt);
    });
  }

  getHUDData() {
    return this.current().getHUDData();
  }

  consumeHitThisFrame() {
    const tool = this.current();
    const hit = tool.hitThisFrame;
    tool.hitThisFrame = false;
    return hit;
  }
}
