export interface InputState {
  moveX: number;
  moveZ: number;
  sprint: boolean;
  passJustPressed: boolean;
  shootHeld: boolean;
  shootPower: number; // 0 to 1
  shootReleased: boolean;
  throughJustPressed: boolean;
  tackleJustPressed: boolean;
  switchJustPressed: boolean;
  pauseJustPressed: boolean;
}

export class InputManager {
  private keys: Set<string> = new Set();
  private justPressedKeys: Set<string> = new Set();
  private virtualJoystickX: number = 0;
  private virtualJoystickZ: number = 0;
  private virtualSprint: boolean = false;
  private virtualPass: boolean = false;
  private virtualThrough: boolean = false;
  private virtualTackle: boolean = false;
  private virtualShootHeld: boolean = false;
  private shootChargeTime: number = 0;
  private shootFired: boolean = false;
  private shootPowerConsumed: number = 0;

  constructor() {
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleBlur = this.handleBlur.bind(this);

    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (e.repeat) return;
    this.keys.add(e.code);
    this.justPressedKeys.add(e.code);

    // Prevent scrolling when using arrow keys / space
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
  }

  private handleKeyUp(e: KeyboardEvent) {
    this.keys.delete(e.code);
    if (e.code === 'KeyC' || e.code === 'KeyJ') {
      this.shootFired = true;
    }
  }

  private handleBlur() {
    this.keys.clear();
    this.justPressedKeys.clear();
    this.virtualJoystickX = 0;
    this.virtualJoystickZ = 0;
    this.virtualShootHeld = false;
    this.shootChargeTime = 0;
  }

  // Virtual On-Screen Controls API
  public setVirtualJoystick(x: number, z: number) {
    this.virtualJoystickX = x;
    this.virtualJoystickZ = z;
  }

  public setVirtualSprint(active: boolean) {
    this.virtualSprint = active;
  }

  public triggerVirtualPass() {
    this.virtualPass = true;
  }

  public triggerVirtualThrough() {
    this.virtualThrough = true;
  }

  public triggerVirtualTackle() {
    this.virtualTackle = true;
  }

  public setVirtualShoot(held: boolean) {
    if (!held && this.virtualShootHeld) {
      this.shootFired = true;
    }
    this.virtualShootHeld = held;
  }

  public update(dt: number): InputState {
    // 1. Read Gamepad if connected
    let gpX = 0;
    let gpZ = 0;
    let gpSprint = false;
    let gpPass = false;
    let gpShoot = false;
    let gpThrough = false;
    let gpTackle = false;

    if (typeof navigator !== 'undefined' && navigator.getGamepads) {
      const gamepads = navigator.getGamepads();
      const gp = gamepads[0];
      if (gp) {
        if (Math.abs(gp.axes[0]) > 0.15) gpX = gp.axes[0];
        if (Math.abs(gp.axes[1]) > 0.15) gpZ = gp.axes[1];
        if (gp.buttons[5]?.pressed || gp.buttons[7]?.pressed) gpSprint = true; // R1 / R2
        if (gp.buttons[0]?.pressed) gpPass = true; // A / Cross
        if (gp.buttons[2]?.pressed) gpShoot = true; // X / Square
        if (gp.buttons[3]?.pressed) gpThrough = true; // Y / Triangle
        if (gp.buttons[1]?.pressed) gpTackle = true; // B / Circle
      }
    }

    // 2. Keyboard directional vectors
    let kx = 0;
    let kz = 0;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) kz -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) kz += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) kx -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) kx += 1;

    // Combine keyboard, virtual joystick, and gamepad
    let finalX = kx + this.virtualJoystickX + gpX;
    let finalZ = kz + this.virtualJoystickZ + gpZ;
    const len = Math.hypot(finalX, finalZ);
    if (len > 1) {
      finalX /= len;
      finalZ /= len;
    }

    // Sprint
    const sprint =
      this.keys.has('ShiftLeft') ||
      this.keys.has('ShiftRight') ||
      this.virtualSprint ||
      gpSprint;

    // Shoot Charging
    const isShootKeyHeld =
      this.keys.has('KeyC') || this.keys.has('KeyJ') || this.virtualShootHeld || gpShoot;
    if (isShootKeyHeld) {
      this.shootChargeTime = Math.min(1.2, this.shootChargeTime + dt * 1.5);
    }

    let shootReleased = false;
    let finalShootPower = 0;
    if (this.shootFired || (!isShootKeyHeld && this.shootChargeTime > 0)) {
      shootReleased = true;
      finalShootPower = Math.min(1.0, Math.max(0.2, this.shootChargeTime / 1.0));
      this.shootChargeTime = 0;
      this.shootFired = false;
    }

    // One-shot edge events
    const passJustPressed =
      this.justPressedKeys.has('KeyX') ||
      this.justPressedKeys.has('KeyK') ||
      this.virtualPass ||
      gpPass;

    const throughJustPressed =
      this.justPressedKeys.has('KeyZ') ||
      this.justPressedKeys.has('KeyL') ||
      this.virtualThrough ||
      gpThrough;

    const tackleJustPressed =
      this.justPressedKeys.has('KeyV') ||
      this.virtualTackle ||
      gpTackle;

    const switchJustPressed =
      this.justPressedKeys.has('Space') ||
      this.justPressedKeys.has('KeyQ');

    const pauseJustPressed =
      this.justPressedKeys.has('KeyP') ||
      this.justPressedKeys.has('Escape');

    // Reset frame one-shots
    this.justPressedKeys.clear();
    this.virtualPass = false;
    this.virtualThrough = false;
    this.virtualTackle = false;

    return {
      moveX: finalX,
      moveZ: finalZ,
      sprint,
      passJustPressed,
      shootHeld: isShootKeyHeld,
      shootPower: Math.min(1.0, this.shootChargeTime / 1.0),
      shootReleased,
      throughJustPressed,
      tackleJustPressed,
      switchJustPressed,
      pauseJustPressed,
    };
  }

  public destroy() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
  }
}
