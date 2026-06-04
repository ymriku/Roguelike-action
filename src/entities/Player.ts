import Phaser from 'phaser';

type MovementKeys = {
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  jump: Phaser.Input.Keyboard.Key;
  dash: Phaser.Input.Keyboard.Key;
  attack: Phaser.Input.Keyboard.Key;
};

const PLAYER_SPEED = 240;
const JUMP_SPEED = 520;
const DASH_SPEED = 620;
const DASH_DURATION_MS = 160;
const DASH_COOLDOWN_MS = 420;
const DASH_AFTERIMAGE_INTERVAL_MS = 32;
const ATTACK_DURATION_MS = 110;
const ATTACK_COOLDOWN_MS = 260;
const DAMAGE_INVULNERABILITY_MS = 650;
const MAX_HP = 100;

export type PlayerAttackHitbox = Phaser.GameObjects.Rectangle & {
  body: Phaser.Physics.Arcade.Body;
};

export class Player extends Phaser.Physics.Arcade.Sprite {
  private readonly keys: MovementKeys;
  private jumpCount = 0;
  private facing: -1 | 1 = 1;
  private isDashing = false;
  private isAttacking = false;
  private isDead = false;
  private dashReadyAt = 0;
  private attackReadyAt = 0;
  private damageReadyAt = 0;
  private hp = MAX_HP;

  constructor(scene: Phaser.Scene, x: number, y: number, keys: MovementKeys) {
    super(scene, x, y, 'player-placeholder');

    this.keys = keys;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setDragX(1200);
    this.setMaxVelocity(DASH_SPEED, 900);
    this.setSize(28, 42);
    this.setOffset(10, 6);
  }

  update(time: number): void {
    if (this.isDead) {
      this.setVelocity(0, 0);
      return;
    }

    const body = this.body as Phaser.Physics.Arcade.Body;

    // 接地したら二段ジャンプの回数を戻す。落下着地にも対応するため毎フレーム確認する。
    if (body.blocked.down || body.touching.down) {
      this.jumpCount = 0;
    }

    // ダッシュ中は入力による速度上書きを止め、短時間の回避移動を優先する。
    if (this.isDashing) {
      return;
    }

    this.handleHorizontalMovement();
    this.handleJump();
    this.handleDash(time);
    this.handleAttack(time);
  }

  getFacing(): -1 | 1 {
    return this.facing;
  }

  getHp(): number {
    return this.hp;
  }

  getMaxHp(): number {
    return MAX_HP;
  }

  getIsDead(): boolean {
    return this.isDead;
  }

  takeDamage(damage: number, knockbackX: number, knockbackY: number, time: number): boolean {
    if (this.isDead || this.isDashing || time < this.damageReadyAt) {
      return false;
    }

    this.hp = Math.max(0, this.hp - damage);
    this.damageReadyAt = time + DAMAGE_INVULNERABILITY_MS;
    this.setVelocity(knockbackX, knockbackY);
    this.setTint(0xff6b6b);
    this.scene.events.emit('player-damaged', {
      damage,
      x: this.x,
      y: this.y - 36,
    });

    if (this.hp <= 0) {
      this.die();
      return true;
    }

    this.scene.time.delayedCall(130, () => {
      if (!this.isDead) {
        this.clearTint();
      }
    });

    return true;
  }

  createAttackHitbox(): PlayerAttackHitbox {
    const offsetX = this.facing * 34;
    const hitbox = this.scene.add.rectangle(this.x + offsetX, this.y - 2, 58, 36, 0x9be7ff, 0.28);

    this.scene.physics.add.existing(hitbox);

    const body = hitbox.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);

    return hitbox as PlayerAttackHitbox;
  }

  getAttackDurationMs(): number {
    return ATTACK_DURATION_MS;
  }

  private handleHorizontalMovement(): void {
    if (this.keys.left.isDown) {
      this.setVelocityX(-PLAYER_SPEED);
      this.facing = -1;
      this.setFlipX(true);
      return;
    }

    if (this.keys.right.isDown) {
      this.setVelocityX(PLAYER_SPEED);
      this.facing = 1;
      this.setFlipX(false);
      return;
    }

    this.setVelocityX(0);
  }

  private handleJump(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const canUseJump = body.blocked.down || body.touching.down || this.jumpCount < 2;

    if (!Phaser.Input.Keyboard.JustDown(this.keys.jump) || !canUseJump) {
      return;
    }

    this.setVelocityY(-JUMP_SPEED);
    this.jumpCount += 1;
  }

  private handleDash(time: number): void {
    if (!Phaser.Input.Keyboard.JustDown(this.keys.dash) || time < this.dashReadyAt) {
      return;
    }

    this.isDashing = true;
    this.dashReadyAt = time + DASH_COOLDOWN_MS;
    this.setVelocity(this.facing * DASH_SPEED, 0);
    this.setTint(0x8bd3ff);
    this.createDashAfterimages();

    this.scene.time.delayedCall(DASH_DURATION_MS, () => {
      this.isDashing = false;
      this.clearTint();
    });
  }

  private handleAttack(time: number): void {
    if (!Phaser.Input.Keyboard.JustDown(this.keys.attack) || time < this.attackReadyAt || this.isAttacking) {
      return;
    }

    this.isAttacking = true;
    this.attackReadyAt = time + ATTACK_COOLDOWN_MS;
    this.setTint(0xf7d46a);
    this.scene.events.emit('player-attack', this.createAttackHitbox());

    this.scene.time.delayedCall(ATTACK_DURATION_MS, () => {
      this.isAttacking = false;
      if (!this.isDead) {
        this.clearTint();
      }
    });
  }

  private die(): void {
    this.isDead = true;
    this.setTint(0x7f1d1d);
    this.setVelocity(0, 0);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = false;

    this.scene.events.emit('player-dead');
  }

  private createDashAfterimages(): void {
    this.scene.time.addEvent({
      delay: DASH_AFTERIMAGE_INTERVAL_MS,
      repeat: 4,
      callback: () => {
        const afterimage = this.scene.add.image(this.x, this.y, 'player-placeholder');
        afterimage.setFlipX(this.flipX);
        afterimage.setAlpha(0.32);
        afterimage.setTint(0x8bd3ff);
        afterimage.setDepth(this.depth - 1);

        this.scene.tweens.add({
          targets: afterimage,
          alpha: 0,
          scaleX: 0.92,
          scaleY: 0.92,
          duration: 180,
          onComplete: () => {
            afterimage.destroy();
          },
        });
      },
    });
  }
}
