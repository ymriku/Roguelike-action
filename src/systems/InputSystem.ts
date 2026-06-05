import Phaser from 'phaser';

export type InputAction =
  | 'left'
  | 'right'
  | 'jump'
  | 'attack'
  | 'dash'
  | 'skill1'
  | 'skill2'
  | 'ultimate';

const INPUT_ACTIONS: InputAction[] = ['left', 'right', 'jump', 'attack', 'dash', 'skill1', 'skill2', 'ultimate'];
type ActionBindings = Partial<Record<InputAction, Phaser.Input.Keyboard.Key[]>>;

export class InputSystem {
  private readonly bindings: ActionBindings;
  private readonly virtualPressCounts = new Map<InputAction, number>();
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
      attack: [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F), keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J)],
      dash: [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT)],
      skill1: [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z), keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K)],
      skill2: [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X), keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L)],
      ultimate: [keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C), keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I)],
    };
  }

  isDown(action: InputAction): boolean {
    return this.isKeyboardDown(action) || (this.virtualPressCounts.get(action) ?? 0) > 0;
  }

  justDown(action: InputAction): boolean {
    return this.isDown(action) && this.previousDown.get(action) !== true;
  }

  justUp(action: InputAction): boolean {
    return !this.isDown(action) && this.previousDown.get(action) === true;
  }

  press(action: InputAction): void {
    this.virtualPressCounts.set(action, (this.virtualPressCounts.get(action) ?? 0) + 1);
  }

  release(action: InputAction): void {
    this.virtualPressCounts.set(action, Math.max(0, (this.virtualPressCounts.get(action) ?? 0) - 1));
  }

  endFrame(): void {
    for (const action of INPUT_ACTIONS) {
      this.previousDown.set(action, this.isDown(action));
    }
  }

  private isKeyboardDown(action: InputAction): boolean {
    return this.bindings[action]?.some((key) => key.isDown) ?? false;
  }
}
