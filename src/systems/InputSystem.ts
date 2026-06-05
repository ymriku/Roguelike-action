import Phaser from 'phaser';

export type InputAction =
  | 'left'
  | 'right'
  | 'jump'
  | 'dash'
  | 'skill1'
  | 'skill2'
  | 'ultimate';

type ActionBindings = Partial<Record<InputAction, Phaser.Input.Keyboard.Key[]>>;

export class InputSystem {
  private readonly bindings: ActionBindings;
  private readonly virtualDown = new Map<InputAction, boolean>();
  private readonly previousDown = new Map<InputAction, boolean>();

  constructor(scene: Phaser.Scene) {
    const keyboard = scene.input.keyboard;

    if (!keyboard) {
      throw new Error('Keyboard input is required for the Phase1 prototype.');
    }

    this.bindings = {
      left: [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A), keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT)],
      right: [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D), keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT)],
      jump: [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE), keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP)],
      dash: [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT)],
      skill1: [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J), keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z)],
      skill2: [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K), keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X)],
      ultimate: [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L), keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C)],
    };
  }

  isDown(action: InputAction): boolean {
    return this.isKeyboardDown(action) || this.virtualDown.get(action) === true;
  }

  justDown(action: InputAction): boolean {
    return this.isDown(action) && this.previousDown.get(action) !== true;
  }

  justUp(action: InputAction): boolean {
    return !this.isDown(action) && this.previousDown.get(action) === true;
  }

  press(action: InputAction): void {
    this.virtualDown.set(action, true);
  }

  release(action: InputAction): void {
    this.virtualDown.set(action, false);
  }

  endFrame(): void {
    for (const action of Object.keys(this.bindings) as InputAction[]) {
      this.previousDown.set(action, this.isDown(action));
    }
  }

  private isKeyboardDown(action: InputAction): boolean {
    return this.bindings[action]?.some((key) => key.isDown) ?? false;
  }
}
