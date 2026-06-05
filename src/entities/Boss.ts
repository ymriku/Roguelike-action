import Phaser from 'phaser';
import { Enemy, EnemyType } from './Enemy';

export class Boss extends Enemy {
  private phase = 0;
  private nextPhaseThresholds = [0.66, 0.33];

  constructor(scene: Phaser.Scene, x: number, y: number, type: EnemyType) {
    super(scene, x, y, type);

    if (type === 'finalBoss') {
      this.setScale(1.8);
      this.nextPhaseThresholds = [0.78, 0.42];
    } else if (type === 'midboss') {
      this.setScale(1.5);
      this.nextPhaseThresholds = [0.72, 0.38];
    } else {
      this.setScale(1.6);
    }
  }

  update(player: Phaser.Types.Physics.Arcade.GameObjectWithBody | any): void {
    super.update(player);

    // Change phase based on HP ratio
    const hpRatio = this.getHp() / this.getMaxHp();

    if (this.phase === 0 && hpRatio <= this.nextPhaseThresholds[0]) {
      this.enterPhase(1);
    }

    if (this.phase === 1 && hpRatio <= this.nextPhaseThresholds[1]) {
      this.enterPhase(2);
    }
  }

  private enterPhase(phase: number): void {
    this.phase = phase;
    // Visual cue
    this.scene.tweens.add({
      targets: this,
      tint: 0xffd166,
      duration: 180,
      yoyo: true,
    });

    // Increase aggression a bit
    if (phase === 1) {
      // faster
      (this as any).config.speed *= 1.18;
    }

    if (phase === 2) {
      (this as any).config.speed *= 1.28;
    }
  }
}
