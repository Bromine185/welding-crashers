export class NPCManager {
  constructor() {
    this.npcs = [];
    this.saboteurDefeated = false;
  }

  add(npc) {
    this.npcs.push(npc);
    return npc;
  }

  update(dt, ctx) {
    for (const npc of this.npcs) npc.update(dt, ctx);
    for (const npc of this.npcs) if (npc.type === "saboteur" && !npc.alive) this.saboteurDefeated = true;
  }

  findNearestHostile(position, radius, exclude) {
    let best = null, bestDist = Infinity;
    for (const npc of this.npcs) {
      if (!npc.alive || !npc.isHostile || npc === exclude) continue;
      const d = Math.hypot(npc.position.x - position.x, npc.position.y - position.y, npc.position.z - position.z);
      if (d <= radius && d < bestDist) {
        best = npc;
        bestDist = d;
      }
    }
    return best;
  }

  getAllHurtboxes() {
    return this.npcs.filter(n => n.alive && n.isHostile).map(n => n.getHurtbox());
  }

  // Physical blockers for movement collision: every living NPC (hostile or
  // not), unlike getAllHurtboxes() which is weapon-hit detection only.
  getCollisionBoxes() {
    return this.npcs.filter(n => n.alive).map(n => n.getHurtbox());
  }

  getAll() {
    return this.npcs;
  }
}
