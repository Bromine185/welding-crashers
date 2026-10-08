import * as THREE from "three";
import { moveWithCollision } from "../world/Collision.js";

const MOUSE_SENSITIVITY = 0.0022;
const MAX_PITCH = Math.PI / 2 - 0.05;

export class PlayerController {
  constructor(camera, input, level) {
    this.camera = camera;
    this.input = input;

    this.position = {
      x: level.spawnPoints.player.x,
      y: level.spawnPoints.player.y,
      z: level.spawnPoints.player.z,
    };
    this.velocity = { x: 0, y: 0, z: 0 };

    this.yaw = 0;
    this.pitch = 0;

    this.hp = 100;
    this.maxHp = 100;

    this.halfWidth = 0.35;
    this.height = 1.8;
    this.eyeHeight = 1.6;
    this.grounded = false;

    this.walkSpeed = 5;
    this.sprintSpeed = 8;
    this.jumpSpeed = 6;
    this.gravity = -20;

    this._syncCamera();
  }

  update(dt, ctx) {
    const delta = this.input.consumeMouseDelta();
    this.yaw -= delta.x * MOUSE_SENSITIVITY;
    this.pitch -= delta.y * MOUSE_SENSITIVITY;
    this.pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, this.pitch));

    // movement input relative to yaw (standard FPS basis: forward = -Z rotated by yaw, right = +X rotated by yaw, using camera convention where yaw rotates around Y)
    let moveX = 0;
    let moveZ = 0;
    if (this.input.isDown("KeyW")) moveZ -= 1;
    if (this.input.isDown("KeyS")) moveZ += 1;
    if (this.input.isDown("KeyA")) moveX -= 1;
    if (this.input.isDown("KeyD")) moveX += 1;

    const len = Math.hypot(moveX, moveZ);
    if (len > 0) {
      moveX /= len;
      moveZ /= len;
    }

    const sinY = Math.sin(this.yaw);
    const cosY = Math.cos(this.yaw);
    const worldX = moveX * cosY - moveZ * sinY; // rotate the local move vector by yaw into world space
    const worldZ = moveX * sinY + moveZ * cosY;

    const speed = this.input.isDown("ShiftLeft") ? this.sprintSpeed : this.walkSpeed;
    this.velocity.x = worldX * speed;
    this.velocity.z = worldZ * speed;
    this.velocity.y += this.gravity * dt;

    if (this.grounded && this.input.justPressed("Space")) {
      this.velocity.y = this.jumpSpeed;
    }

    // level walls/crates plus every living NPC, so e.g. the Captain physically blocks the player
    const colliders = ctx.level.colliders.concat(ctx.npcManager.getCollisionBoxes());
    const result = moveWithCollision(this.position, this.halfWidth, this.height, this.velocity, colliders, dt);
    this.grounded = result.grounded;

    this._syncCamera();
  }

  _syncCamera() {
    this.camera.position.set(this.position.x, this.position.y + this.eyeHeight, this.position.z);
    this.camera.rotation.order = "YXZ";
    this.camera.rotation.set(this.pitch, this.yaw, 0);
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }
}
