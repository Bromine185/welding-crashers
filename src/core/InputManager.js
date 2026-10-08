export class InputManager {
  constructor(domElement) {
    this.domElement = domElement;

    this._keys = new Set();
    this._justPressed = new Set();
    // accumulates edges between update() calls so a keydown+keyup pair that
    // completes within a single animation frame (e.g. a fast synthetic
    // press, or a frame hitch) still registers as a press that frame,
    // instead of being missed by diffing two once-per-frame state snapshots.
    this._pendingJustPressed = new Set();

    this._mouseDelta = { x: 0, y: 0 };
    this._leftMouseDown = false;

    this._onKeyDown = (e) => {
      if (!this._keys.has(e.code)) this._pendingJustPressed.add(e.code);
      this._keys.add(e.code);
    };
    this._onKeyUp = (e) => {
      this._keys.delete(e.code);
    };
    this._onMouseMove = (e) => {
      this._mouseDelta.x += e.movementX || 0;
      this._mouseDelta.y += e.movementY || 0;
    };
    this._onMouseDown = (e) => {
      if (e.button === 0) this._leftMouseDown = true;
    };
    this._onMouseUp = (e) => {
      if (e.button === 0) this._leftMouseDown = false;
    };
    this._onContextMenu = (e) => {
      e.preventDefault();
    };

    window.addEventListener("keydown", this._onKeyDown);
    window.addEventListener("keyup", this._onKeyUp);
    window.addEventListener("mousemove", this._onMouseMove);
    this.domElement.addEventListener("mousedown", this._onMouseDown);
    this.domElement.addEventListener("mouseup", this._onMouseUp);
    this.domElement.addEventListener("contextmenu", this._onContextMenu);
  }

  requestPointerLock() {
    try {
      this.domElement.requestPointerLock();
    } catch (e) {
      // Headless/automated browsers may reject this silently; raw
      // mousemove deltas keep input working without a real lock.
    }
  }

  update() {
    this._justPressed = this._pendingJustPressed;
    this._pendingJustPressed = new Set();
  }

  isDown(code) {
    return this._keys.has(code);
  }

  justPressed(code) {
    return this._justPressed.has(code);
  }

  isLeftMouseDown() {
    return this._leftMouseDown;
  }

  consumeMouseDelta() {
    const delta = { x: this._mouseDelta.x, y: this._mouseDelta.y };
    this._mouseDelta.x = 0;
    this._mouseDelta.y = 0;
    return delta;
  }
}
