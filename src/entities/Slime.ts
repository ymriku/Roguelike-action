import Phaser from 'phaser';
import { Player } from './Player';

const SLIME_MAX_HP = 30;
const SLIME_SPEED = 105;
const SLIME_DAMAGE_INVULNERABILITY_MS = 180;
const ATTACK_DAMAGE = 25;

export class Slime extends Phaser.Physics.Arcade.Sprite {
  private hp = SLIME_MAX_HP;
  private damageReadyAt = 0;
  private isDead = false;
  private readonly healthBarBack: Phaser.GameObjects.Rectangle;
  private readonly healthBarFill: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'slime-placeholder');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setDragX(900);
    this.setMaxVelocity(180, 700);
    this.setSize(34, 24);
    this.setOffset(7, 20);

    this.healthBarBack = scene.add.rectangle(x, y - 34, 38, 5, 0x1f2933);
    this.healthBarBack.setDepth(20);
    this.healthBarFill = scene.add.rectangle(x, y - 34, 36, 3, 0x7ff0b2);
    this.healthBarFill.setDepth(21);
    this.updateHealthBar();
  }

  update(player: Player): void {
    if (this.isDead || player.getIsDead()) {
      this.setVelocityX(0);
      return;
    }

    this.updateHealthBar();

    const distanceX = player.x - this.x;

    if (Math.abs(distanceX) > 520 || Math.abs(distanceX) < 20) {
      this.setVelocityX(0);
      return;
    }

    const direction = Math.sign(distanceX);
    this.setVelocityX(direction * SLIME_SPEED);
    this.setFlipX(direction < 0);
  }

  takeDamage(damage: number, knockbackX: number, knockbackY: number, time: number): boolean {
    if (this.isDead || time < this.damageReadyAt) {
      return false;
    }

    this.hp = Math.max(0, this.hp - damage);
    this.damageReadyAt = time + SLIME_DAMAGE_INVULNERABILITY_MS;
    this.setVelocity(knockbackX, knockbackY);
    this.setTint(0xfff0a3);
    this.updateHealthBar();
    this.scene.events.emit('slime-damaged', {
      damage,
      x: this.x,
      y: this.y - 28,
    });

    if (this.hp <= 0) {
      this.die();
      return true;
    }

    this.scene.time.delayedCall(100, () => {
      if (!this.isDead) {
        this.clearTint();
      }
    });

    return true;
  }

  getContactDamage(): number {
    return ATTACK_DAMAGE;
  }

  getHp(): number {
    return this.hp;
  }

  getMaxHp(): number {
    return SLIME_MAX_HP;
  }

  getIsDead(): boolean {
    return this.isDead;
  }

  private die(): void {
    this.isDead = true;
    this.setTint(0x5d6b78);
    this.setVelocity(0, 0);
    this.healthBarBack.setVisible(false);
    this.healthBarFill.setVisible(false);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = false;

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 0.75,
      scaleY: 0.75,
      duration: 220,
      onComplete: () => {
        this.healthBarBack.destroy();
        this.healthBarFill.destroy();
        this.destroy();
        this.scene.events.emit('slime-defeated');
      },
    });
  }

  private updateHealthBar(): void {
    const fillWidth = Phaser.Math.Clamp(this.hp / SLIME_MAX_HP, 0, 1) * 36;

    this.healthBarBack.setPosition(this.x, this.y - 34);
    this.healthBarFill.setPosition(this.x - 18 + fillWidth / 2, this.y - 34);
    this.healthBarFill.setSize(fillWidth, 3);
    this.healthBarFill.setFillStyle(this.hp <= SLIME_MAX_HP / 2 ? 0xffd166 : 0x7ff0b2);
  }
}
