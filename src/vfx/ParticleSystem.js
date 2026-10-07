import * as THREE from "three";

const CAPACITY = 500;
const GRAVITY_Y = -4;

function randomUnitVector() {
  const theta = Math.random() * Math.PI * 2;
  const z = Math.random() * 2 - 1;
  const r = Math.sqrt(1 - z * z);
  return new THREE.Vector3(r * Math.cos(theta), r * Math.sin(theta), z);
}

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.capacity = CAPACITY;

    this.particles = [];
    for (let i = 0; i < this.capacity; i++) {
      this.particles.push({
        active: false,
        x: 0, y: -9999, z: 0,
        vx: 0, vy: 0, vz: 0,
        life: 0, maxLife: 0,
        r: 1, g: 1, b: 1,
      });
    }
    this._nextSlot = 0;

    this._positions = new Float32Array(this.capacity * 3);
    this._colors = new Float32Array(this.capacity * 3);
    for (let i = 0; i < this.capacity; i++) {
      this._positions[i * 3 + 1] = -9999;
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute("position", new THREE.BufferAttribute(this._positions, 3));
    this.geometry.setAttribute("color", new THREE.BufferAttribute(this._colors, 3));

    this.material = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    // positions are mutated every frame between the -9999 dummy slot and real
    // spawn points, so a cached bounding sphere would go stale; skip frustum
    // culling for this object instead of recomputing it every frame.
    this.points.frustumCulled = false;
    this.scene.add(this.points);

    this._lines = [];
  }

  _allocSlot() {
    const slot = this._nextSlot;
    this._nextSlot = (this._nextSlot + 1) % this.capacity;
    return slot;
  }

  spawnSparks(position, normal, opts = {}) {
    const { count = 12, color = 0xffaa33, speed = 3, life = 0.4 } = opts;
    const col = new THREE.Color(color);

    for (let i = 0; i < count; i++) {
      const slot = this._allocSlot();
      const p = this.particles[slot];

      p.x = position.x + (Math.random() * 2 - 1) * 0.05;
      p.y = position.y + (Math.random() * 2 - 1) * 0.05;
      p.z = position.z + (Math.random() * 2 - 1) * 0.05;

      const dir = randomUnitVector();
      if (normal) {
        if (dir.dot(normal) < 0) dir.multiplyScalar(-1);
      }

      const spd = speed * (0.3 + Math.random() * 0.7);
      p.vx = dir.x * spd;
      p.vy = dir.y * spd;
      p.vz = dir.z * spd;

      const variance = 1 + (Math.random() * 0.4 - 0.2);
      p.maxLife = life * variance;
      p.life = p.maxLife;

      p.r = col.r;
      p.g = col.g;
      p.b = col.b;

      p.active = true;
    }
  }

  spawnLine(start, end, color = 0x66ddff, life = 0.15) {
    const positions = new Float32Array([start.x, start.y, start.z, end.x, end.y, end.z]);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 1 });
    const object3D = new THREE.Line(geometry, material);

    this.scene.add(object3D);
    this._lines.push({ object3D, ttl: life, maxTtl: life });
  }

  update(dt) {
    const positions = this._positions;
    const colors = this._colors;

    for (let i = 0; i < this.capacity; i++) {
      const p = this.particles[i];
      const idx = i * 3;

      if (p.active) {
        p.vy += GRAVITY_Y * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z += p.vz * dt;
        p.life -= dt;
        if (p.life <= 0) {
          p.active = false;
        }
      }

      if (p.active) {
        positions[idx] = p.x;
        positions[idx + 1] = p.y;
        positions[idx + 2] = p.z;

        const fade = Math.max(p.life / p.maxLife, 0);
        colors[idx] = p.r * fade;
        colors[idx + 1] = p.g * fade;
        colors[idx + 2] = p.b * fade;
      } else {
        positions[idx] = 0;
        positions[idx + 1] = -9999;
        positions[idx + 2] = 0;

        colors[idx] = 0;
        colors[idx + 1] = 0;
        colors[idx + 2] = 0;
      }
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;

    for (let i = this._lines.length - 1; i >= 0; i--) {
      const entry = this._lines[i];
      entry.ttl -= dt;

      if (entry.ttl <= 0) {
        this.scene.remove(entry.object3D);
        entry.object3D.geometry.dispose();
        entry.object3D.material.dispose();
        this._lines.splice(i, 1);
      } else {
        entry.object3D.material.opacity = entry.ttl / entry.maxTtl;
      }
    }
  }
}
