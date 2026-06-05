import Phaser from 'phaser';
import { ClassDefinition, getClassDefinition } from '../classes';
import { InputSystem } from '../systems/InputSystem';

const DASH_SPEED = 620;
const DASH_DURATION_MS = 160;
const DASH_COOLDOWN_MS = 420;
const DASH_AFTERIMAGE_INTERVAL_MS = 32;
const ATTACK_DURATION_MS = 110;
const COMBO_RESET_MS = 620;
const IAIDO_MIN_CHARGE_MS = 520;
const IAIDO_MAX_CHARGE_MS = 1200;
const IAIDO_DURATION_MS = 170;
const COUNTER_WINDOW_MS = 420;
const COUNTER_DURATION_MS = 180;
const DAMAGE_INVULNERABILITY_MS = 650;

export type PlayerAttackHitbox = Phaser.GameObjects.Rectangle & {
  body: Phaser.Physics.Arcade.Body;
};

export type PlayerAttackPayload = {
  hitbox: PlayerAttackHitbox;
  damage: number;
  knockbackX: number;
  knockbackY: number;
  durationMs: number;
  effectColor: number;
};

export type PlayerSkillCooldown = {
  id: 'skill1' | 'skill2' | 'ultimate';
  label: string;
  readyAt: number;
  cooldownMs: number;
};

export class Player extends Phaser.Physics.Arcade.Sprite {
  private readonly inputSystem: InputSystem;
  private readonly classDefinition: ClassDefinition;
  private jumpCount = 0;
  private facing: -1 | 1 = 1;
  private isDashing = false;
  private isAttacking = false;
  private isChargingIaido = false;
  private isCountering = false;
  private isDead = false;
  private dashReadyAt = 0;
  private attackReadyAt = 0;
  private iaidoReadyAt = 0;
  private counterReadyAt = 0;
  private damageReadyAt = 0;
  private skill2PressedAt = 0;
  private comboStep = 0;
  private comboReadyUntil = 0;
  private hp: number;
  private speedMultiplier = 1;

  constructor(scene: Phaser.Scene, x: number, y: number, inputSystem: InputSystem, classDefinition = getClassDefinition()) {
    super(scene, x, y, 'samurai-idle', 0);

    this.inputSystem = inputSystem;
    this.classDefinition = classDefinition;
    this.hp = classDefinition.maxHp;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setDragX(420);
    this.setMaxVelocity(DASH_SPEED, 900);
    this.setScale(1.75);
    this.setSize(16, 24);
    this.setOffset(8, 7);
    this.play('samurai-idle');
  }

  update(time: number): void {
    if (this.isDead) {
      this.setVelocity(0, 0);
      return;
    }

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body.blocked.down || body.touching.down) {
      this.jumpCount = 0;
    }

    if (this.isDashing) {
      this.updateAnimation();
      return;
    }

    this.handleHorizontalMovement();
    this.handleJump();
    this.handleCounter(time);
    this.handleDash(time);
    this.handleAttackInput(time);
    this.updateAnimation();
  }

  getFacing(): -1 | 1 {
    return this.facing;
  }

  getHp(): number {
    return this.hp;
  }

  getMaxHp(): number {
    return this.classDefinition.maxHp;
  }

  getIsDead(): boolean {
    return this.isDead;
  }

  getSkillCooldowns(): PlayerSkillCooldown[] {
    return [
      {
        id: 'skill1',
        label: this.classDefinition.skills.skill1.name,
        readyAt: this.attackReadyAt,
        cooldownMs: this.classDefinition.skills.skill1.cooldownMs,
      },
      {
        id: 'skill2',
        label: this.classDefinition.skills.skill2.name,
        readyAt: this.iaidoReadyAt,
        cooldownMs: this.classDefinition.skills.skill2.cooldownMs,
      },
      {
        id: 'ultimate',
        label: this.classDefinition.skills.ultimate.name,
        readyAt: this.counterReadyAt,
        cooldownMs: this.classDefinition.skills.ultimate.cooldownMs,
      },
    ];
  }

  takeDamage(damage: number, knockbackX: number, knockbackY: number, time: number): boolean {
    if (this.isDead || this.isDashing || time < this.damageReadyAt) {
      return false;
    }

    if (this.isCountering) {
      this.isCountering = false;
      this.counterReadyAt = time + this.classDefinition.skills.ultimate.cooldownMs;
      this.damageReadyAt = time + COUNTER_DURATION_MS + 220;
      this.setVelocity(this.facing * 220, -120);
      this.setTint(0xa7f3d0);
      this.scene.events.emit('player-counter', this.createCounterAttackPayload());
      this.scene.time.delayedCall(COUNTER_DURATION_MS, () => {
        if (!this.isDead && !this.isAttacking) {
          this.clearTint();
        }
      });
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

  applySlow(factor: number, durationMs: number): void {
    this.speedMultiplier = factor;
    this.setTint(0x9be7ff);
    this.scene.time.delayedCall(durationMs, () => {
      this.speedMultiplier = 1;
      if (!this.isDead) {
        this.clearTint();
      }
    });
  }

  createAttackHitbox(width = 58, height = 36, offsetX = 34, offsetY = -2, color = 0x9be7ff): PlayerAttackHitbox {
    const hitbox = this.scene.add.rectangle(this.x + this.facing * offsetX, this.y + offsetY, width, height, color, 0.28);

    this.scene.physics.add.existing(hitbox);
    const body = hitbox.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    return hitbox as PlayerAttackHitbox;
  }

  private handleHorizontalMovement(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const speed = this.classDefinition.moveSpeed * this.speedMultiplier;

    if (this.inputSystem.isDown('left')) {
      this.setVelocityX(-speed);
      this.facing = -1;
      this.setFlipX(true);
      return;
    }

    if (this.inputSystem.isDown('right')) {
      this.setVelocityX(speed);
      this.facing = 1;
      this.setFlipX(false);
      return;
    }

    if (Math.abs(body.velocity.x) < 16) {
      body.setVelocityX(0);
    }
  }

  private handleJump(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const maxJumpCount = 2;
    const canUseJump = body.blocked.down || body.touching.down || this.jumpCount < maxJumpCount;

    if (!this.inputSystem.justDown('jump') || !canUseJump) {
      return;
    }

    this.setVelocityY(-this.classDefinition.jumpPower);
    this.jumpCount += 1;
  }

  private handleDash(time: number): void {
    if (
      !this.inputSystem.justDown('dash') ||
      time < this.dashReadyAt ||
      this.isAttacking ||
      this.isChargingIaido ||
      this.isCountering
    ) {
      return;
    }

    this.isDashing = true;
    this.dashReadyAt = time + DASH_COOLDOWN_MS;
    this.setVelocity(this.facing * DASH_SPEED, 0);
    this.setTint(0x8bd3ff);
    this.play('samurai-dash', true);
    this.createDashAfterimages();

    this.scene.time.delayedCall(DASH_DURATION_MS, () => {
      this.isDashing = false;
      if (!this.isDead) {
        this.clearTint();
      }
    });
  }

  private handleAttackInput(time: number): void {
    if (this.isAttacking || this.isDashing || this.isCountering) {
      return;
    }

    if (this.inputSystem.justDown('skill1') && time >= this.attackReadyAt) {
      this.executeComboAttack(time);
      return;
    }

    if (this.inputSystem.justDown('skill2')) {
      this.skill2PressedAt = time;
      this.isChargingIaido = false;
      return;
    }

    if (this.inputSystem.isDown('skill2') && this.skill2PressedAt > 0) {
      this.handleIaidoCharge(time);
      return;
    }

    if (!this.inputSystem.justUp('skill2') || this.skill2PressedAt === 0) {
      return;
    }

    const heldMs = time - this.skill2PressedAt;
    this.skill2PressedAt = 0;

    if (heldMs >= IAIDO_MIN_CHARGE_MS && time >= this.iaidoReadyAt) {
      this.executeIaidoAttack(time, heldMs);
    }
  }

  private handleIaidoCharge(time: number): void {
    const heldMs = time - this.skill2PressedAt;

    if (heldMs < IAIDO_MIN_CHARGE_MS || time < this.iaidoReadyAt) {
      return;
    }

    this.isChargingIaido = true;
    this.setVelocityX(0);
    this.setTint(heldMs >= IAIDO_MAX_CHARGE_MS ? 0xe0f2fe : 0xbde0fe);
  }

  private executeComboAttack(time: number): void {
    this.isChargingIaido = false;

    if (time > this.comboReadyUntil) {
      this.comboStep = 0;
    }

    this.comboStep = (this.comboStep % 3) + 1;
    this.comboReadyUntil = time + COMBO_RESET_MS;

    const isFinisher = this.comboStep === 3;
    const durationMs = isFinisher ? ATTACK_DURATION_MS + 40 : ATTACK_DURATION_MS;
    this.isAttacking = true;
    this.attackReadyAt = time + this.classDefinition.skills.skill1.cooldownMs;
    this.setTint(0xf7d46a);
    this.play('samurai-attack', true);
    this.scene.events.emit('player-attack', {
      hitbox: this.createAttackHitbox(isFinisher ? 72 : 58, isFinisher ? 42 : 36, isFinisher ? 42 : 34),
      damage: isFinisher ? 22 : 12 + this.comboStep * 3,
      knockbackX: isFinisher ? 360 : 260,
      knockbackY: isFinisher ? -220 : -160,
      durationMs,
      effectColor: isFinisher ? 0xfff1a8 : 0xb8f3ff,
    } satisfies PlayerAttackPayload);

    this.scene.time.delayedCall(durationMs, () => {
      this.isAttacking = false;
      if (!this.isDead) {
        this.clearTint();
      }
    });
  }

  private executeIaidoAttack(time: number, heldMs: number): void {
    this.isChargingIaido = false;
    this.isAttacking = true;
    this.comboStep = 0;
    this.attackReadyAt = time + this.classDefinition.skills.skill1.cooldownMs;
    this.iaidoReadyAt = time + this.classDefinition.skills.skill2.cooldownMs;
    this.setTint(0xe0f2fe);
    this.setVelocityX(this.facing * 120);
    this.play('samurai-attack', true);

    const chargeRatio = Phaser.Math.Clamp(heldMs / IAIDO_MAX_CHARGE_MS, 0, 1);
    this.scene.events.emit('player-attack', {
      hitbox: this.createAttackHitbox(104, 34, 58, -2, 0xdbeafe),
      damage: Math.round(32 + chargeRatio * 18),
      knockbackX: 520,
      knockbackY: -120,
      durationMs: IAIDO_DURATION_MS,
      effectColor: 0xdbeafe,
    } satisfies PlayerAttackPayload);

    this.scene.time.delayedCall(IAIDO_DURATION_MS, () => {
      this.isAttacking = false;
      if (!this.isDead) {
        this.clearTint();
      }
    });
  }

  private handleCounter(time: number): void {
    if (
      !this.inputSystem.justDown('ultimate') ||
      time < this.counterReadyAt ||
      this.isAttacking ||
      this.isDashing ||
      this.isChargingIaido
    ) {
      return;
    }

    this.isCountering = true;
    this.setVelocityX(0);
    this.setTint(0x86efac);

    this.scene.time.delayedCall(COUNTER_WINDOW_MS, () => {
      if (!this.isDead && this.isCountering) {
        this.isCountering = false;
        this.counterReadyAt = this.scene.time.now + this.classDefinition.skills.ultimate.cooldownMs;
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
        const afterimage = this.scene.add.sprite(this.x, this.y, this.texture.key, this.frame.name);
        afterimage.setFlipX(this.flipX);
        afterimage.setScale(this.scaleX, this.scaleY);
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

  private createCounterAttackPayload(): PlayerAttackPayload {
    return {
      hitbox: this.createAttackHitbox(82, 46, 42, -4, 0xa7f3d0),
      damage: 30,
      knockbackX: 430,
      knockbackY: -240,
      durationMs: COUNTER_DURATION_MS,
      effectColor: 0xa7f3d0,
    };
  }

  private updateAnimation(): void {
    if (this.isDashing) {
      this.play('samurai-dash', true);
      return;
    }

    if (this.isAttacking) {
      this.play('samurai-attack', true);
      return;
    }

    if (this.isChargingIaido || this.isCountering) {
      this.play('samurai-idle', true);
      return;
    }

    const body = this.body as Phaser.Physics.Arcade.Body;
    this.play(Math.abs(body.velocity.x) > 1 ? 'samurai-run' : 'samurai-idle', true);
  }
}
