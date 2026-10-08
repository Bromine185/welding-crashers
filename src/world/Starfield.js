import * as THREE from "three";

const STAR_COUNT = 2000;
const MIN_RADIUS = 150;
const MAX_RADIUS = 400;

export class Starfield {
  constructor(scene) {
    scene.background = new THREE.Color(0x000006);

    const positions = new Float32Array(STAR_COUNT * 3);
    for (let i = 0; i < STAR_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = MIN_RADIUS + Math.random() * (MAX_RADIUS - MIN_RADIUS);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      size: 1.2,
      color: 0xffffff,
      sizeAttenuation: false,
    });

    this.points = new THREE.Points(geometry, material);
    scene.add(this.points);
  }

  update(dt) {
    this.points.rotation.y += dt * 0.004; // slow parallax drift, purely cosmetic
  }
}
