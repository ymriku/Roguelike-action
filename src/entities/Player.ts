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
  status?: 'burn' | 'freeze' | 'slow' | 'bleed';
  statusDurationMs?: number;
};

export type PlayerProjectilePayload = {
  kind: 'bullet' | 'grenade' | 'rocket' | 'fireball' | 'ice-spear';
  x: number;
  y: number;
  width: number;
  height: number;
  velocityX: number;
  velocityY: number;
  allowGravity: boolean;
  damage: number;
  knockbackX: number;
  knockbackY: number;
  durationMs: number;
  color: number;
  explosionRadius?: number;
  status?: 'burn' | 'freeze' | 'slow' | 'bleed';
  statusDurationMs?: number;
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
  private readonly animationPrefix: string;
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
  private basicAttackReadyAt = 0;
  private skill2PressedAt = 0;
  private comboStep = 0;
  private comboReadyUntil = 0;
  private hp: number;
  private speedMultiplier = 1;

  constructor(scene: Phaser.Scene, x: number, y: number, inputSystem: InputSystem, classDefinition = getClassDefinition()) {
    super(scene, x, y, 'samurai-idle', 0);

    this.inputSystem = inputSystem;
    this.classDefinition = classDefinition;
    this.animationPrefix = classDefinition.id;
    this.hp = classDefinition.maxHp;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setDragX(420);
    this.setMaxVelocity(DASH_SPEED, 900);
    this.setScale(1.75);
    this.setSize(16, 24);
    this.setOffset(8, 7);
    this.play(`${this.animationPrefix}-idle`);
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

  defeatByFall(): void {
    if (this.isDead) {
      return;
    }

    this.hp = 0;
    this.die();
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
    hitbox.setDepth(34);

    this.scene.physics.add.existing(hitbox);
    const body = hitbox.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    body.setSize(width, height);
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
    this.play(`${this.animationPrefix}-dash`, true);
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

    if (this.inputSystem.justDown('attack') && time >= this.basicAttackReadyAt) {
      this.executeBasicAttack(time);
      return;
    }

    if (this.inputSystem.justDown('skill1') && time >= this.attackReadyAt) {
      this.executeSkill1(time);
      return;
    }

    if (this.classDefinition.id !== 'samurai' && this.inputSystem.justDown('skill2') && time >= this.iaidoReadyAt) {
      this.executeSkill2(time);
      return;
    }

    if (this.classDefinition.id !== 'samurai' && this.inputSystem.justDown('ultimate') && time >= this.counterReadyAt) {
      this.executeUltimate(time);
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

    if (time >= this.iaidoReadyAt) {
      this.executeIaidoAttack(time, Math.max(heldMs, IAIDO_MIN_CHARGE_MS));
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

  private executeBasicAttack(time: number): void {
    switch (this.classDefinition.id) {
      case 'machinist':
        this.fireProjectile(time, {
          kind: 'bullet',
          width: 22,
          height: 8,
          velocityX: this.facing * 560,
          velocityY: 0,
          allowGravity: false,
          damage: 14,
          knockbackX: 220,
          knockbackY: -80,
          durationMs: 900,
          color: 0xfff1a8,
        }, 170);
        return;
      case 'pyromancer':
        this.fireProjectile(time, {
          kind: 'fireball',
          width: 22,
          height: 22,
          velocityX: this.facing * 360,
          velocityY: -20,
          allowGravity: false,
          damage: 16,
          knockbackX: 230,
          knockbackY: -100,
          durationMs: 1000,
          color: 0xff6b3d,
          explosionRadius: 44,
          status: 'burn',
          statusDurationMs: 900,
        }, 380);
        return;
      case 'frost-lancer':
        this.fireProjectile(time, {
          kind: 'ice-spear',
          width: 34,
          height: 10,
          velocityX: this.facing * 430,
          velocityY: 0,
          allowGravity: false,
          damage: 15,
          knockbackX: 260,
          knockbackY: -100,
          durationMs: 900,
          color: 0x9be7ff,
          status: 'slow',
          statusDurationMs: 900,
        }, 320);
        return;
      case 'beast-warrior':
        this.executeMeleeAttack(time, 62, 42, 35, 18, 310, -190, 0xf5d08a, 240, 'bleed', 900);
        return;
      case 'dragoonblood-knight':
        this.executeMeleeAttack(time, 92, 32, 52, 20, 460, -150, 0xffb274, 330);
        return;
      case 'samurai':
      default:
        this.executeComboAttack(time);
    }
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
    this.basicAttackReadyAt = time + this.classDefinition.skills.skill1.cooldownMs;
    this.setTint(0xf7d46a);
    this.play(`${this.animationPrefix}-attack`, true);
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

  private executeSkill1(time: number): void {
    this.attackReadyAt = time + this.classDefinition.skills.skill1.cooldownMs;
    switch (this.classDefinition.id) {
      case 'machinist':
        this.fireProjectile(time, {
          kind: 'grenade',
          width: 14,
          height: 14,
          velocityX: this.facing * 330,
          velocityY: -260,
          allowGravity: true,
          damage: 26,
          knockbackX: 420,
          knockbackY: -260,
          durationMs: 950,
          color: 0x93c572,
          explosionRadius: 72,
        }, 0, false);
        return;
      case 'samurai':
        this.executeMeleeAttack(time, 86, 34, 48, 28, 420, -180, 0xf8fafc, 300);
        return;
      case 'pyromancer':
        this.executeMeleeAttack(time, 106, 62, 48, 24, 260, -180, 0xff8a3d, 420, 'burn', 1100);
        return;
      case 'frost-lancer':
        this.executeMeleeAttack(time, 116, 34, 62, 24, 360, -160, 0xbfeeff, 360, 'freeze', 700);
        return;
      case 'beast-warrior':
        this.setVelocityX(this.facing * 380);
        this.executeMeleeAttack(time, 78, 48, 46, 30, 430, -220, 0xf5d08a, 360, 'bleed', 1200);
        return;
      case 'dragoonblood-knight':
        this.setVelocity(this.facing * 420, -80);
        this.executeMeleeAttack(time, 112, 38, 64, 30, 540, -150, 0xffb274, 380);
        return;
    }
  }

  private executeSkill2(time: number): void {
    this.iaidoReadyAt = time + this.classDefinition.skills.skill2.cooldownMs;
    switch (this.classDefinition.id) {
      case 'machinist':
        this.setTint(0xffe08a);
        for (let i = 0; i < 5; i += 1) {
          this.scene.time.delayedCall(i * 85, () => {
            if (!this.isDead) {
              this.fireProjectile(this.scene.time.now, {
                kind: 'bullet',
                width: 20,
                height: 8,
                velocityX: this.facing * 590,
                velocityY: (i % 2 === 0 ? -18 : 18),
                allowGravity: false,
                damage: 9,
                knockbackX: 160,
                knockbackY: -70,
                durationMs: 760,
                color: 0xfff1a8,
              }, 0, false);
            }
          });
        }
        this.scene.time.delayedCall(520, () => this.clearTint());
        return;
      case 'pyromancer':
        this.executeMeleeAttack(time, 150, 82, 42, 34, 320, -240, 0xff4d4d, 520, 'burn', 1600);
        return;
      case 'frost-lancer':
        this.executeMeleeAttack(time, 142, 42, 70, 34, 360, -180, 0xdbeafe, 520, 'freeze', 1100);
        return;
      case 'beast-warrior':
        this.setVelocity(this.facing * 520, -180);
        this.executeMeleeAttack(time, 92, 56, 52, 34, 520, -300, 0xf0c36a, 460, 'bleed', 1600);
        return;
      case 'dragoonblood-knight':
        this.setVelocity(this.facing * 220, -520);
        this.scene.time.delayedCall(220, () => {
          if (!this.isDead) {
            this.setVelocityY(560);
            this.executeMeleeAttack(this.scene.time.now, 126, 72, 40, 48, 420, -360, 0xff8f70, 420);
          }
        });
        return;
    }
  }

  private executeUltimate(time: number): void {
    this.counterReadyAt = time + this.classDefinition.skills.ultimate.cooldownMs;
    switch (this.classDefinition.id) {
      case 'machinist':
        this.fireProjectile(time, {
          kind: 'rocket',
          width: 26,
          height: 10,
          velocityX: this.facing * 520,
          velocityY: -18,
          allowGravity: false,
          damage: 48,
          knockbackX: 680,
          knockbackY: -320,
          durationMs: 1100,
          color: 0xffb454,
          explosionRadius: 108,
          status: 'burn',
          statusDurationMs: 1200,
        }, 0, false);
        return;
      case 'pyromancer':
        this.executeMeleeAttack(time, 210, 112, 0, 62, 440, -320, 0xff6b3d, 650, 'burn', 2200);
        return;
      case 'frost-lancer':
        this.executeMeleeAttack(time, 190, 92, 0, 54, 260, -260, 0xbfeeff, 680, 'freeze', 1800);
        return;
      case 'beast-warrior':
        this.executeMeleeAttack(time, 180, 96, 0, 44, 620, -360, 0xf5d08a, 620, 'bleed', 2200);
        return;
      case 'dragoonblood-knight':
        this.setVelocity(this.facing * 320, -620);
        this.scene.time.delayedCall(280, () => {
          if (!this.isDead) {
            this.setVelocityY(680);
            this.executeMeleeAttack(this.scene.time.now, 168, 96, 24, 58, 720, -380, 0xff8f70, 620);
          }
        });
        return;
    }
  }

  private executeMeleeAttack(
    time: number,
    width: number,
    height: number,
    offsetX: number,
    damage: number,
    knockbackX: number,
    knockbackY: number,
    effectColor: number,
    cooldownMs: number,
    status?: PlayerAttackPayload['status'],
    statusDurationMs?: number,
  ): void {
    this.isAttacking = true;
    this.basicAttackReadyAt = Math.max(this.basicAttackReadyAt, time + cooldownMs);
    this.setTint(effectColor);
    this.play(`${this.animationPrefix}-attack`, true);
    this.scene.events.emit('player-attack', {
      hitbox: this.createAttackHitbox(width, height, offsetX),
      damage,
      knockbackX,
      knockbackY,
      durationMs: Math.min(260, cooldownMs),
      effectColor,
      status,
      statusDurationMs,
    } satisfies PlayerAttackPayload);

    this.scene.time.delayedCall(Math.min(260, cooldownMs), () => {
      this.isAttacking = false;
      if (!this.isDead) {
        this.clearTint();
      }
    });
  }

  private fireProjectile(
    time: number,
    projectile: Omit<PlayerProjectilePayload, 'x' | 'y'>,
    cooldownMs: number,
    setAttackState = true,
  ): void {
    if (cooldownMs > 0) {
      this.basicAttackReadyAt = time + cooldownMs;
    }
    if (setAttackState) {
      this.isAttacking = true;
      this.setTint(projectile.color);
      this.play(`${this.animationPrefix}-attack`, true);
    }
    this.scene.events.emit('player-projectile', {
      ...projectile,
      x: this.x + this.facing * 28,
      y: this.y - 8,
    } satisfies PlayerProjectilePayload);

    if (!setAttackState) {
      return;
    }

    this.scene.time.delayedCall(140, () => {
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
    this.basicAttackReadyAt = time + 420;
    this.iaidoReadyAt = time + this.classDefinition.skills.skill2.cooldownMs;
    this.setTint(0xe0f2fe);
    this.setVelocityX(this.facing * 120);
    this.play(`${this.animationPrefix}-attack`, true);

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
      this.classDefinition.id !== 'samurai' ||
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
      this.play(`${this.animationPrefix}-dash`, true);
      return;
    }

    if (this.isAttacking) {
      this.play(`${this.animationPrefix}-attack`, true);
      return;
    }

    if (this.isChargingIaido || this.isCountering) {
      this.play(`${this.animationPrefix}-idle`, true);
      return;
    }

    const body = this.body as Phaser.Physics.Arcade.Body;
    this.play(`${this.animationPrefix}-${Math.abs(body.velocity.x) > 1 ? 'run' : 'idle'}`, true);
  }
}
