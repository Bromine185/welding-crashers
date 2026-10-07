import * as THREE from "three";
import { moveWithCollision, castRay } from "../world/Collision.js";

export class NPCBase {
  constructor({ type, isHostile, position, speed, maxHp, halfWidth = 0.4, height = 1.8, flies = false }) {
    this.type = type;
    this.isHostile = isHostile;
    this.position = { x: position.x, y: position.y, z: position.z };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.facing = 0;
    this.speed = speed;
    this.hp = maxHp;
    this.maxHp = maxHp;
    this.halfWidth = halfWidth;
    this.height = height;
    this.flies = flies;
    this.state = "idle";
    this.stateTimer = 0;
    this.alive = true;
    this.mesh = null;
    this._wpIndex = 0;
    this._losTimer = 0;
  }

  setState(s) {
    this.state = s;
    this.stateTimer = 0;
  }

  update(dt, ctx) {
    if (!this.alive) return;
    this.stateTimer += dt;
    this._updateState(dt, ctx);
    this._syncMesh();
  }

  _updateState(dt, ctx) {}

  _syncMesh() {
    if (this.mesh) {
      this.mesh.position.set(this.position.x, this.position.y, this.position.z);
      this.mesh.rotation.y = this.facing;
    }
  }

  _applyMovement(dt, ctx) {
    moveWithCollision(this.position, this.halfWidth, this.height, this.velocity, ctx.level.colliders, dt, { skipY: this.flies });
  }

  _seekTowards(targetPos, speed) {
    const dx = targetPos.x - this.position.x, dz = targetPos.z - this.position.z;
    const dist = Math.hypot(dx, dz);
    if (dist > 0.05) {
      this.velocity.x = (dx / dist) * speed;
      this.velocity.z = (dz / dist) * speed;
      this.facing = Math.atan2(dx, dz);
    } else {
      this.velocity.x = 0;
      this.velocity.z = 0;
    }
    return dist;
  }

  _waypointFollow(route, speed) {
    if (!route || route.length === 0) return 0;
    const wp = route[this._wpIndex % route.length];
    const dist = this._seekTowards(wp, speed);
    if (dist < 0.6) this._wpIndex = (this._wpIndex + 1) % route.length;
    return dist;
  }

  _distanceTo(pos) {
    return Math.hypot(this.position.x - pos.x, this.position.y - pos.y, this.position.z - pos.z);
  }

  getEyePosition() {
    return { x: this.position.x, y: this.position.y + this.height * 0.9, z: this.position.z };
  }

  hasLineOfSightTo(targetPos, level) {
    const eye = this.getEyePosition();
    const dx = targetPos.x - eye.x, dy = targetPos.y - eye.y, dz = targetPos.z - eye.z;
    const dist = Math.hypot(dx, dy, dz);
    if (dist < 0.001) return true;
    const dir = { x: dx / dist, y: dy / dist, z: dz / dist };
    const hit = castRay(eye, dir, dist - 0.1, [{ kind: "wall", items: level.colliders }]);
    return hit === null;
  }

  takeDamage(amount) {
    if (!this.alive) return;
    this.hp -= amount;
    if (this.mesh && this.mesh.material && this.mesh.material.emissive) {
      this.mesh.material.emissiveIntensity = 2;
    }
    if (this.isHostile && (this.state === "idle" || this.state === "patrol")) this.setState("alert");
    if (this.hp <= 0) this.die();
  }

  die() {
    if (!this.alive) return;
    this.alive = false;
    this.hp = 0;
    if (this.mesh) this.mesh.visible = false;
  }

  getHurtbox() {
    return {
      minX: this.position.x - this.halfWidth,
      minY: this.position.y,
      minZ: this.position.z - this.halfWidth,
      maxX: this.position.x + this.halfWidth,
      maxY: this.position.y + this.height,
      maxZ: this.position.z + this.halfWidth,
      npc: this,
    };
  }
}
