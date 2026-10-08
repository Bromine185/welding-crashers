import * as THREE from "three";
import { castRay } from "../world/Collision.js";

export class WeldingTool {
  constructor({ name, range, resourceType, resourceMax, resourceStart }) {
    this.name = name;
    this.range = range;
    this.resource = { type: resourceType, current: resourceStart, max: resourceMax };
    this.isFiring = false;
    this.locked = false;
    this._lockoutTimer = 0;
    this.hitThisFrame = false;
  }

  startFire() {
    this.isFiring = true;
  }

  stopFire() {
    this.isFiring = false;
  }

  canFire() {
    return !this.locked && this.resource.current > 0;
  }

  getHUDData() {
    return {
      name: this.name,
      resourceType: this.resource.type,
      current: this.resource.current,
      max: this.resource.max,
      overheated: this.locked,
    };
  }

  idleRegen(dt) {}

  // Draws the muzzle-to-target beam every firing frame, independent of what (if anything)
  // was hit -- without this, a miss (hit === null) produced no visual at all, and even a hit
  // only showed a spark burst at the target with nothing connecting it back to the gun.
  // The visual origin is offset forward/down from the eye (a stand-in "muzzle" point): a line
  // starting exactly AT the camera is viewed almost perfectly end-on (you're always looking
  // straight down your own aim ray), so it foreshortens to an unreadable point-blank blob
  // instead of a visible beam -- a small offset gives it actual on-screen length and also
  // keeps the line's near end comfortably past the camera's near-clip plane.
  _fireVisual(ctx, hit, color) {
    const eye = ctx.camera.getWorldPosition(new THREE.Vector3());
    const direction = ctx.camera.getWorldDirection(new THREE.Vector3());
    const right = new THREE.Vector3().crossVectors(direction, ctx.camera.up).normalize();
    const origin = eye
      .clone()
      .addScaledVector(direction, 0.5)
      .addScaledVector(right, 0.18)
      .add(new THREE.Vector3(0, -0.18, 0));
    const end = hit
      ? hit.point
      : {
          x: eye.x + direction.x * this.range,
          y: eye.y + direction.y * this.range,
          z: eye.z + direction.z * this.range,
        };
    ctx.particleSystem.spawnLine(origin, end, color, 0.08);
  }

  _raycastFromCamera(ctx) {
    const origin = ctx.camera.getWorldPosition(new THREE.Vector3());
    const direction = ctx.camera.getWorldDirection(new THREE.Vector3());
    const targetLists = [
      { kind: "wall", items: ctx.level.colliders },
      { kind: "npc", items: ctx.npcManager.getAllHurtboxes() },
      { kind: "breach", items: ctx.level.breachPoints.filter((b) => !b.repaired) },
      { kind: "door", items: [...ctx.level.doors, ...ctx.level.crates] },
    ];
    return castRay(origin, direction, this.range, targetLists);
  }

  _applyHit(hit, dt, ctx, damagePerSecondOrFlat, isFlatDamage) {
    if (!hit) return;
    this.hitThisFrame = true;
    const amount = isFlatDamage ? damagePerSecondOrFlat : damagePerSecondOrFlat * dt;
    if (hit.kind === "npc") {
      hit.item.npc.takeDamage(amount);
      ctx.particleSystem.spawnSparks(hit.point, null, { color: 0xff6644 });
    } else if (hit.kind === "breach") {
      ctx.objectiveManager.registerWeldHit(hit.item.id, dt);
      ctx.particleSystem.spawnSparks(hit.point, null, { color: 0xffee66, count: 6 });
    } else if (hit.kind === "door") {
      hit.item.applyCut(amount);
      ctx.particleSystem.spawnSparks(hit.point, null, { color: 0xffaa33, count: 8 });
      if (hit.item.isOpen) ctx.audioManager.playDoorCut();
    } else if (hit.kind === "wall") {
      ctx.particleSystem.spawnSparks(hit.point, null, { color: 0xaaaaff, count: 4 });
    }
    return amount;
  }
}
