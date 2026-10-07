export class InputManager {
  constructor(domElement) {
    this.domElement = domElement;

    this._keys = new Set();
    this._prevKeys = new Set();
    this._justPressed = new Set();

    this._mouseDelta = { x: 0, y: 0 };
    this._leftMouseDown = false;

    this._onKeyDown = (e) => {
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
    this._justPressed.clear();
    for (const code of this._keys) {
      if (!this._prevKeys.has(code)) this._justPressed.add(code);
    }
    this._prevKeys = new Set(this._keys);
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
