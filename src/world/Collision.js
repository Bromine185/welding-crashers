export function aabbIntersect(a, b) {
  return (
    a.minX <= b.maxX && a.maxX >= b.minX &&
    a.minY <= b.maxY && a.maxY >= b.minY &&
    a.minZ <= b.maxZ && a.maxZ >= b.minZ
  );
}

export function moveWithCollision(position, halfWidth, height, velocity, colliders, dt, options) {
  const skipY = !!(options && options.skipY === true);
  let blockedX = false;
  let blockedZ = false;
  let grounded = false;

  const newX = position.x + velocity.x * dt;
  {
    const box = {
      minX: newX - halfWidth,
      maxX: newX + halfWidth,
      minY: position.y,
      maxY: position.y + height,
      minZ: position.z - halfWidth,
      maxZ: position.z + halfWidth,
    };
    let hit = null;
    for (let i = 0; i < colliders.length; i++) {
      if (aabbIntersect(box, colliders[i])) {
        hit = colliders[i];
        break;
      }
    }
    if (hit) {
      if (velocity.x > 0) {
        position.x = hit.minX - halfWidth - 0.001;
      } else if (velocity.x < 0) {
        position.x = hit.maxX + halfWidth + 0.001;
      }
      velocity.x = 0;
      blockedX = true;
    } else {
      position.x = newX;
    }
  }

  const newZ = position.z + velocity.z * dt;
  {
    const box = {
      minX: position.x - halfWidth,
      maxX: position.x + halfWidth,
      minY: position.y,
      maxY: position.y + height,
      minZ: newZ - halfWidth,
      maxZ: newZ + halfWidth,
    };
    let hit = null;
    for (let i = 0; i < colliders.length; i++) {
      if (aabbIntersect(box, colliders[i])) {
        hit = colliders[i];
        break;
      }
    }
    if (hit) {
      if (velocity.z > 0) {
        position.z = hit.minZ - halfWidth - 0.001;
      } else if (velocity.z < 0) {
        position.z = hit.maxZ + halfWidth + 0.001;
      }
      velocity.z = 0;
      blockedZ = true;
    } else {
      position.z = newZ;
    }
  }

  if (skipY) {
    position.y += velocity.y * dt;
  } else {
    const newY = position.y + velocity.y * dt;
    const box = {
      minX: position.x - halfWidth,
      maxX: position.x + halfWidth,
      minY: newY,
      maxY: newY + height,
      minZ: position.z - halfWidth,
      maxZ: position.z + halfWidth,
    };
    let hit = null;
    for (let i = 0; i < colliders.length; i++) {
      if (aabbIntersect(box, colliders[i])) {
        hit = colliders[i];
        break;
      }
    }
    if (hit) {
      if (velocity.y <= 0) {
        position.y = hit.maxY + 0.001;
        velocity.y = 0;
        grounded = true;
      } else {
        position.y = hit.minY - height - 0.001;
        velocity.y = 0;
      }
    } else {
      position.y = newY;
      grounded = false;
    }
  }

  return { position, grounded, blockedX, blockedZ };
}

export function castRay(origin, direction, maxDistance, targetLists) {
  let best = null;

  for (let li = 0; li < targetLists.length; li++) {
    const { kind, items } = targetLists[li];
    for (let ii = 0; ii < items.length; ii++) {
      const item = items[ii];
      let tmin = -Infinity;
      let tmax = Infinity;
      let missed = false;

      const axes = ["x", "y", "z"];
      const minKeys = { x: "minX", y: "minY", z: "minZ" };
      const maxKeys = { x: "maxX", y: "maxY", z: "maxZ" };

      for (let a = 0; a < axes.length; a++) {
        const axis = axes[a];
        const d = direction[axis];
        const o = origin[axis];
        const min = item[minKeys[axis]];
        const max = item[maxKeys[axis]];

        if (d === 0) {
          if (o < min || o > max) {
            missed = true;
            break;
          }
        } else {
          let t1 = (min - o) / d;
          let t2 = (max - o) / d;
          if (t1 > t2) {
            const tmp = t1;
            t1 = t2;
            t2 = tmp;
          }
          tmin = Math.max(tmin, t1);
          tmax = Math.min(tmax, t2);
          if (tmin > tmax) {
            missed = true;
            break;
          }
        }
      }

      if (missed) continue;
      if (tmax < 0) continue;

      const t = tmin >= 0 ? tmin : tmax;
      if (t > maxDistance) continue;

      if (best === null || t < best.distance) {
        best = {
          distance: t,
          point: {
            x: origin.x + direction.x * t,
            y: origin.y + direction.y * t,
            z: origin.z + direction.z * t,
          },
          kind,
          item,
        };
      }
    }
  }

  return best;
}
