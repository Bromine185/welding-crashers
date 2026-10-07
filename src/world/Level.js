import * as THREE from "three";

const WALL_HEIGHT = 6;
const THICKNESS = 0.3;
const HALF_THICK = THICKNESS / 2;
const TRIM_THICKNESS = 0.08;
const TRIM_HEIGHT = 0.1;
const FLOOR_MIN_Y = -THICKNESS;
const CEIL_MAX_Y = WALL_HEIGHT + THICKNESS;

const ROOMS = [
  { name: "bridge", xMin: -5, xMax: 5, zMin: -32, zMax: -22, zMinGap: null, zMaxGap: [-1.5, 1.5] },
  { name: "engineering", xMin: -5, xMax: 5, zMin: -18, zMax: -6, zMinGap: [-1.5, 1.5], zMaxGap: [-1.5, 1.5] },
  { name: "weldbay", xMin: -5, xMax: 5, zMin: -2, zMax: 8, zMinGap: [-1.5, 1.5], zMaxGap: [-1.5, 1.5] },
  { name: "cargo", xMin: -5, xMax: 5, zMin: 12, zMax: 26, zMinGap: [-1.5, 1.5], zMaxGap: null, xMaxGlass: true },
];

const CORRIDORS = [
  { name: "corridorA", xMin: -1.5, xMax: 1.5, zMin: -22, zMax: -18 },
  { name: "corridorB", xMin: -1.5, xMax: 1.5, zMin: -6, zMax: -2 },
  { name: "corridorC", xMin: -1.5, xMax: 1.5, zMin: 8, zMax: 12 },
];

const BREACH_SPECS = [
  { id: "breach-1", position: { x: 4.7, y: 2.0, z: -15 } },
  { id: "breach-2", position: { x: -4.7, y: 2.0, z: -9 } },
  { id: "breach-3", position: { x: -4.7, y: 2.0, z: 5 } },
  { id: "breach-4", position: { x: -4.7, y: 2.0, z: 18 } },
  { id: "breach-5", position: { x: -4.7, y: 2.0, z: 24 } },
];

const CRATE_SPECS = [
  { id: "crate-1", position: { x: 2, y: 0.5, z: 4 } },
  { id: "crate-2", position: { x: 3, y: 0.5, z: 15 } },
  { id: "crate-3", position: { x: -3, y: 0.5, z: 20 } },
];

function createBreach(level, spec) {
  const { x, y, z } = spec.position;
  const half = 0.4;
  const geometry = new THREE.SphereGeometry(0.3, 16, 16);
  const material = new THREE.MeshStandardMaterial({
    color: 0xff3333,
    emissive: 0xff3333,
    emissiveIntensity: 1.6,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  level.scene.add(mesh);

  return {
    id: spec.id,
    position: { x, y, z },
    mesh,
    repaired: false,
    progress: 0,
    minX: x - half,
    minY: y - half,
    minZ: z - half,
    maxX: x + half,
    maxY: y + half,
    maxZ: z + half,
  };
}

function createCrate(level, spec) {
  const { x, y, z } = spec.position;
  const half = 0.5;
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({
    color: 0x8a5a2f,
    roughness: 0.8,
    metalness: 0.2,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  level.scene.add(mesh);

  const colliderRef = {
    minX: x - half,
    minY: y - half,
    minZ: z - half,
    maxX: x + half,
    maxY: y + half,
    maxZ: z + half,
  };
  level.colliders.push(colliderRef);

  return {
    id: spec.id,
    position: { x, y, z },
    mesh,
    minX: colliderRef.minX,
    minY: colliderRef.minY,
    minZ: colliderRef.minZ,
    maxX: colliderRef.maxX,
    maxY: colliderRef.maxY,
    maxZ: colliderRef.maxZ,
    cutProgress: 0,
    cutThreshold: 100,
    isOpen: false,
    colliderRef,
    _level: level,
    applyCut(amount) {
      this.cutProgress += amount;
      if (!this.isOpen && this.cutProgress >= this.cutThreshold) {
        this.isOpen = true;
        const idx = this._level.colliders.indexOf(this.colliderRef);
        if (idx !== -1) this._level.colliders.splice(idx, 1);
        this.mesh.rotation.z = Math.PI / 4;
        this.mesh.material.color.set(0x3a2a1a);
      }
    },
  };
}

export class Level {
  constructor(scene) {
    this.scene = scene;
    this.colliders = [];
    this.breachPoints = [];
    this.crates = [];
    this.doors = [];
    this.spawnPoints = {
      player: { x: 0, y: 0, z: -27 },
      captain: { x: 0, y: 0, z: -30.5 },
      ally: { x: 2, y: 0, z: -14 },
      medic: { x: 1, y: 0, z: -25 },
      saboteur: { x: -3, y: 0, z: -15 },
      turret: { x: 4.7, y: 3, z: 3 },
      drone1: { x: 3, y: 2, z: 18 },
      drone2: { x: -3, y: 2, z: 22 },
    };
    this.patrolRoutes = {
      engineeringLoop: [
        { x: -3, y: 0, z: -15 },
        { x: 3, y: 0, z: -15 },
        { x: 3, y: 0, z: -9 },
        { x: -3, y: 0, z: -9 },
      ],
      cargoLoop: [
        { x: 3, y: 2, z: 18 },
        { x: 3, y: 2, z: 24 },
        { x: -2, y: 2, z: 24 },
        { x: -2, y: 2, z: 18 },
      ],
    };

    this.wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a3f47,
      roughness: 0.6,
      metalness: 0.4,
    });
    this.glassMaterial = new THREE.MeshStandardMaterial({
      color: 0x224466,
      transparent: true,
      opacity: 0.22,
      roughness: 0.1,
      metalness: 0.1,
    });
    this.trimMaterial = new THREE.MeshStandardMaterial({
      color: 0x111318,
      emissive: 0x33ddee,
      emissiveIntensity: 0.7,
      roughness: 0.5,
      metalness: 0.3,
    });

    this.build();
  }

  addBox(minX, minY, minZ, maxX, maxY, maxZ, material, collide = true) {
    const geometry = new THREE.BoxGeometry(maxX - minX, maxY - minY, maxZ - minZ);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set((minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2);
    this.scene.add(mesh);

    const collider = { minX, minY, minZ, maxX, maxY, maxZ };
    if (collide) this.colliders.push(collider);
    return { mesh, collider };
  }

  addTrim(minX, minY, minZ, maxX, maxY, maxZ) {
    const geometry = new THREE.BoxGeometry(maxX - minX, maxY - minY, maxZ - minZ);
    const mesh = new THREE.Mesh(geometry, this.trimMaterial);
    mesh.position.set((minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2);
    this.scene.add(mesh);
    return mesh;
  }

  buildEndWall(xMin, xMax, zLine, gap, material, side) {
    const zWallMin = zLine - HALF_THICK;
    const zWallMax = zLine + HALF_THICK;
    // interior faces +z off a zMin-side wall, and -z off a zMax-side wall
    const trimZMin = side === "min" ? zLine + HALF_THICK : zLine - HALF_THICK - TRIM_THICKNESS;
    const trimZMax = side === "min" ? zLine + HALF_THICK + TRIM_THICKNESS : zLine - HALF_THICK;

    if (!gap) {
      this.addBox(xMin, 0, zWallMin, xMax, WALL_HEIGHT, zWallMax, material);
      this.addTrim(xMin, 0, trimZMin, xMax, TRIM_HEIGHT, trimZMax);
      return;
    }

    const [gapMin, gapMax] = gap;
    this.addBox(xMin, 0, zWallMin, gapMin, WALL_HEIGHT, zWallMax, material);
    this.addBox(gapMax, 0, zWallMin, xMax, WALL_HEIGHT, zWallMax, material);
    this.addTrim(xMin, 0, trimZMin, gapMin, TRIM_HEIGHT, trimZMax);
    this.addTrim(gapMax, 0, trimZMin, xMax, TRIM_HEIGHT, trimZMax);
  }

  buildRoom(spec) {
    const { xMin, xMax, zMin, zMax, zMinGap, zMaxGap, xMaxGlass } = spec;
    const material = this.wallMaterial;

    this.addBox(xMin, FLOOR_MIN_Y, zMin, xMax, 0, zMax, material);
    this.addBox(xMin, WALL_HEIGHT, zMin, xMax, CEIL_MAX_Y, zMax, material);

    this.addBox(xMin - HALF_THICK, 0, zMin, xMin + HALF_THICK, WALL_HEIGHT, zMax, material);
    this.addBox(xMax - HALF_THICK, 0, zMin, xMax + HALF_THICK, WALL_HEIGHT, zMax, xMaxGlass ? this.glassMaterial : material);

    this.addTrim(xMin + HALF_THICK, 0, zMin, xMin + HALF_THICK + TRIM_THICKNESS, TRIM_HEIGHT, zMax);
    this.addTrim(xMax - HALF_THICK - TRIM_THICKNESS, 0, zMin, xMax - HALF_THICK, TRIM_HEIGHT, zMax);

    this.buildEndWall(xMin, xMax, zMin, zMinGap, material, "min");
    this.buildEndWall(xMin, xMax, zMax, zMaxGap, material, "max");
  }

  buildCorridor(spec) {
    const { xMin, xMax, zMin, zMax } = spec;
    const material = this.wallMaterial;

    this.addBox(xMin, FLOOR_MIN_Y, zMin, xMax, 0, zMax, material);
    this.addBox(xMin, WALL_HEIGHT, zMin, xMax, CEIL_MAX_Y, zMax, material);

    this.addBox(xMin - HALF_THICK, 0, zMin, xMin + HALF_THICK, WALL_HEIGHT, zMax, material);
    this.addBox(xMax - HALF_THICK, 0, zMin, xMax + HALF_THICK, WALL_HEIGHT, zMax, material);

    this.addTrim(xMin + HALF_THICK, 0, zMin, xMin + HALF_THICK + TRIM_THICKNESS, TRIM_HEIGHT, zMax);
    this.addTrim(xMax - HALF_THICK - TRIM_THICKNESS, 0, zMin, xMax - HALF_THICK, TRIM_HEIGHT, zMax);
  }

  addRoomLighting(room) {
    const length = room.zMax - room.zMin;
    const xCenter = (room.xMin + room.xMax) / 2;
    const y = WALL_HEIGHT - 0.5;

    const positions =
      length > 11
        ? [room.zMin + length / 3, room.zMin + (length * 2) / 3]
        : [(room.zMin + room.zMax) / 2];

    for (const z of positions) {
      const light = new THREE.PointLight(0xffcc88, 5, 12, 2);
      light.position.set(xCenter, y, z);
      this.scene.add(light);
    }
  }

  build() {
    this.scene.add(new THREE.AmbientLight(0x404050, 1.0));

    for (const room of ROOMS) {
      this.buildRoom(room);
      this.addRoomLighting(room);
    }
    for (const corridor of CORRIDORS) {
      this.buildCorridor(corridor);
    }

    const reactorGeometry = new THREE.CylinderGeometry(1.2, 1.2, 6, 20);
    const reactorMaterial = new THREE.MeshStandardMaterial({
      color: 0x331a0f,
      emissive: 0xff6622,
      emissiveIntensity: 1.5,
    });
    const reactor = new THREE.Mesh(reactorGeometry, reactorMaterial);
    reactor.position.set(0, 3, -12);
    this.scene.add(reactor);

    for (const spec of BREACH_SPECS) {
      this.breachPoints.push(createBreach(this, spec));
    }
    for (const spec of CRATE_SPECS) {
      this.crates.push(createCrate(this, spec));
    }
  }

  update(dt) {
    const now = performance.now();
    for (let i = 0; i < this.breachPoints.length; i++) {
      const breach = this.breachPoints[i];
      if (breach.repaired) continue;
      breach.mesh.material.emissiveIntensity = 1.5 + Math.sin(now / 300 + i) * 0.5;
    }
  }
}
