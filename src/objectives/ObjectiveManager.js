export class ObjectiveManager {
  constructor(level) {
    this.level = level;
    this.total = level.breachPoints.length;
    this.captain = null;
  }

  setCaptain(captain) {
    this.captain = captain;
  }

  registerWeldHit(breachId, dt) {
    const breach = this.level.breachPoints.find((b) => b.id === breachId);
    if (!breach || breach.repaired) return;

    breach.progress += 0.2 * dt;

    if (breach.progress >= 1 && !breach.repaired) {
      breach.progress = 1;
      breach.repaired = true;
      breach.mesh.material.color.set(0x33ff77);
      breach.mesh.material.emissive.set(0x33ff77);
      breach.mesh.material.emissiveIntensity = 2.0;
      if (this.captain) {
        this.captain.sayLine("Breach sealed. " + this.repairedCount() + " of " + this.total + " patched.");
      }
    }
  }

  repairedCount() {
    return this.level.breachPoints.filter((b) => b.repaired).length;
  }

  isAllBreachesRepaired() {
    return this.repairedCount() === this.total;
  }

  checkWinCondition(npcManager) {
    return this.isAllBreachesRepaired() && npcManager.saboteurDefeated === true;
  }
}
