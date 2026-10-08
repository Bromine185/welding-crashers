export class HUD {
  constructor() {
    this.crosshair = document.getElementById("crosshair");
    this.hitMarker = document.getElementById("hit-marker");
    this.vignette = document.getElementById("vignette");
    this.weaponName = document.getElementById("weapon-name");
    this.resourceBar = document.getElementById("resource-bar");
    this.resourceFill = document.getElementById("resource-fill");
    this.healthBar = document.getElementById("health-bar");
    this.healthFill = document.getElementById("health-fill");
    this.objectiveCounter = document.getElementById("objective-counter");
    this.interactPrompt = document.getElementById("interact-prompt");
    this.subtitle = document.getElementById("subtitle");
    this.startScreen = document.getElementById("start-screen");
    this.gameOverScreen = document.getElementById("game-over-screen");
    this.victoryScreen = document.getElementById("victory-screen");
    this.startButton = document.getElementById("start-button");
    this.restartLose = document.getElementById("restart-lose");
    this.restartWin = document.getElementById("restart-win");

    this.hitMarkerTimer = null;
    this.subtitleTimer = null;
  }

  update(snapshot) {
    const { hp, maxHp, weapon, objectivesRepaired, objectivesTotal } = snapshot;

    this.healthFill.style.width = (hp / maxHp * 100) + "%";
    this.resourceFill.style.width = (weapon.current / weapon.max * 100) + "%";
    this.weaponName.textContent = weapon.name.toUpperCase() + " — " + weapon.resourceType.toUpperCase();
    this.objectiveCounter.textContent = objectivesRepaired + " / " + objectivesTotal + " BREACHES SEALED";

    this.vignette.classList.toggle("low-hp", hp / maxHp < 0.25);
    this.resourceBar.classList.toggle("overheated", weapon.overheated);
  }

  showHitMarker() {
    this.hitMarker.classList.add("show");
    clearTimeout(this.hitMarkerTimer);
    this.hitMarkerTimer = setTimeout(() => {
      this.hitMarker.classList.remove("show");
    }, 120);
  }

  showInteractPrompt(text) {
    this.interactPrompt.textContent = text;
    this.interactPrompt.classList.add("show");
  }

  hideInteractPrompt() {
    this.interactPrompt.classList.remove("show");
  }

  showSubtitle(text, duration = 3) {
    this.subtitle.textContent = text;
    this.subtitle.classList.add("show");
    clearTimeout(this.subtitleTimer);
    this.subtitleTimer = setTimeout(() => {
      this.subtitle.classList.remove("show");
    }, duration * 1000);
  }

  showGameOverScreen(won) {
    const screen = won ? this.victoryScreen : this.gameOverScreen;
    screen.classList.remove("hidden");
  }

  onStart(cb) {
    this.startButton.addEventListener("click", () => {
      this.startScreen.classList.add("hidden");
      cb();
    });
  }

  onRestart(cb) {
    this.restartLose.addEventListener("click", cb);
    this.restartWin.addEventListener("click", cb);
  }
}
