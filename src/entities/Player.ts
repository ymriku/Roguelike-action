import Phaser from 'phaser';
<<<<<<< HEAD
import { ClassDefinition } from '../classes/ClassDefinition';

type MovementKeys = {
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  jump: Phaser.Input.Keyboard.Key;
  dash: Phaser.Input.Keyboard.Key;
  attack: Phaser.Input.Keyboard.Key;
};

type TouchHoldInput = {
  left: boolean;
  right: boolean;
};

type TouchRequestInput = {
  jump: boolean;
  dash: boolean;
  attack: boolean;
  special: boolean;
};

const BASE_PLAYER_SPEED = 240;
const JUMP_SPEED = 520;
=======
import { ClassDefinition, getClassDefinition } from '../classes';
import { InputSystem } from '../systems/InputSystem';

>>>>>>> f2a20ba (Add class and input systems)
const DASH_SPEED = 620;
const DASH_DURATION_MS = 160;
const DEFAULT_DASH_COOLDOWN_MS = 420;
const DASH_AFTERIMAGE_INTERVAL_MS = 32;
const ATTACK_DURATION_MS = 110;
<<<<<<< HEAD
=======
const COMBO_RESET_MS = 620;
const IAIDO_MIN_CHARGE_MS = 520;
const IAIDO_MAX_CHARGE_MS = 1200;
const IAIDO_DURATION_MS = 170;
const COUNTER_WINDOW_MS = 420;
const COUNTER_DURATION_MS = 180;
>>>>>>> f2a20ba (Add class and input systems)
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
<<<<<<< HEAD
  private readonly keys: MovementKeys;
=======
  private readonly inputSystem: InputSystem;
>>>>>>> f2a20ba (Add class and input systems)
  private readonly classDefinition: ClassDefinition;
  private jumpCount = 0;
  private facing: -1 | 1 = 1;
  private isDashing = false;
  private isAttacking = false;
  private isChargingIaido = false;
  private isCountering = false;
  private isDead = false;
  private currentAnimationKey?: string;
  private dashReadyAt = 0;
  private attackReadyAt = 0;
<<<<<<< HEAD
  private specialReadyAt = 0;
  private specialCharge = 0;
  private specialChargeMax = 100;
  private damageReadyAt = 0;
  private hp: number;
  private attackBonus = 0;
  private speedBonus = 0;
  private speedModifier = 1;
  private attackCooldownReduction = 0;
  private maxHpBonus = 0;
  private counterBoostEnabled = false;
  private touchHold: TouchHoldInput = { left: false, right: false };
  private touchRequest: TouchRequestInput = { jump: false, dash: false, attack: false, special: false };

  constructor(scene: Phaser.Scene, x: number, y: number, keys: MovementKeys, classDefinition: ClassDefinition) {
    super(scene, x, y, classDefinition.spriteKey ?? 'player-placeholder');

    this.keys = keys;
    this.classDefinition = classDefinition;
    this.hp = classDefinition.hp;
=======
  private iaidoReadyAt = 0;
  private counterReadyAt = 0;
  private damageReadyAt = 0;
  private skill2PressedAt = 0;
  private comboStep = 0;
  private comboReadyUntil = 0;
  private hp: number;

  constructor(scene: Phaser.Scene, x: number, y: number, inputSystem: InputSystem, classDefinition = getClassDefinition()) {
    super(scene, x, y, 'samurai-idle', 0);

    this.inputSystem = inputSystem;
    this.classDefinition = classDefinition;
    this.hp = classDefinition.maxHp;
>>>>>>> f2a20ba (Add class and input systems)

    scene.add.existing(this);
    scene.physics.add.existing(this);

    if (classDefinition.spriteKey && !scene.textures.exists(classDefinition.spriteKey)) {
      this.setTexture('player-placeholder');
      scene.textures.on('addtexture', (texture: Phaser.Textures.Texture) => {
        if (texture.key === classDefinition.spriteKey) {
          this.setTexture(texture.key);
        }
      });
    }

    this.setCollideWorldBounds(true);
    this.setDragX(420);
    this.setMaxVelocity(DASH_SPEED, 900);
<<<<<<< HEAD
    this.setSize(28, 42);
    this.setOffset(10, 6);
    this.specialReadyAt = 0;
=======
    this.setScale(1.75);
    this.setSize(16, 24);
    this.setOffset(8, 7);
    this.play('samurai-idle');
>>>>>>> f2a20ba (Add class and input systems)
  }

  update(time: number): void {
    if (this.isDead) {
      this.setVelocity(0, 0);
      return;
    }

    const body = this.body as Phaser.Physics.Arcade.Body;

    // 接地したらジャンプ回数をリセット
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
<<<<<<< HEAD
    this.handleSpecial(time);
    this.handleAttack(time);
    this.updateAnimation();
  }

  private updateAnimation(): void {
    if (this.isDead || this.isDashing || this.isAttacking) {
      return;
    }

    const body = this.body as Phaser.Physics.Arcade.Body;
    const animationKey = Math.abs(body.velocity.x) > 16
      ? `${this.texture.key}-walk`
      : `${this.texture.key}-idle`;

    if (this.currentAnimationKey === animationKey) {
      return;
    }

    if (this.anims.exists(animationKey)) {
      this.play(animationKey, true);
      this.currentAnimationKey = animationKey;
    } else {
      this.currentAnimationKey = undefined;
    }
=======
    this.handleAttackInput(time);
    this.updateAnimation();
>>>>>>> f2a20ba (Add class and input systems)
  }

  getFacing(): -1 | 1 {
    return this.facing;
  }

  getHp(): number {
    return this.hp;
  }

  getMaxHp(): number {
<<<<<<< HEAD
    return this.classDefinition.hp + this.maxHpBonus;
=======
    return this.classDefinition.maxHp;
>>>>>>> f2a20ba (Add class and input systems)
  }

  getIsDead(): boolean {
    return this.isDead;
  }

<<<<<<< HEAD
  getAttackPower(): number {
    let base = this.classDefinition.attack + this.attackBonus;
    if (this.classDefinition.id === 'beast' && this.hp <= this.getMaxHp() * 0.5) {
      base += Math.max(2, Math.floor(this.classDefinition.attack * 0.18));
    }
    return base;
  }

  getSpeed(): number {
    return (BASE_PLAYER_SPEED + this.speedBonus) * this.classDefinition.speed * this.speedModifier;
  }

  getAttackCooldown(): number {
    return Math.max(120, this.classDefinition.attackCooldown - this.attackCooldownReduction);
  }

  heal(amount: number): void {
    if (this.isDead) return;
    this.hp = Math.min(this.getMaxHp(), this.hp + amount);
  }

  increaseMaxHp(amount: number): void {
    this.maxHpBonus += amount;
    this.hp = Math.min(this.getMaxHp(), this.hp + amount);
  }

  setTouchHold(action: 'left' | 'right', isDown: boolean): void {
    this.touchHold[action] = isDown;
  }

  applySkill(skillId: string): void {
    switch (skillId) {
      case 'iaigiri':
        this.attackBonus += 8;
        this.attackCooldownReduction += 60;
        break;
      case 'counterBoost':
        this.counterBoostEnabled = true;
        break;
      default:
        break;
    }
  }

  applyItem(itemId: string): void {
    switch (itemId) {
      case 'potion':
        this.heal(40);
        break;
      case 'speedTonic':
        this.speedBonus += 35;
        break;
      case 'strengthElixir':
        this.attackBonus += 5;
        break;
      case 'minorArtifact':
        this.increaseMaxHp(10);
        break;
      case 'rareArtifact':
        this.increaseMaxHp(18);
        this.attackBonus += 4;
        break;
      default:
        break;
    }
=======
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
>>>>>>> f2a20ba (Add class and input systems)
  }

  takeDamage(damage: number, knockbackX: number, knockbackY: number, time: number): boolean {
    if (this.isDead || this.isDashing || time < this.damageReadyAt) {
      return false;
    }

<<<<<<< HEAD
    let actualDamage = damage;
    if (this.classDefinition.id === 'dragonblood') {
      actualDamage = Math.max(1, Math.floor(damage * 0.85));
    }
    if (this.classDefinition.canCounter && this.isAttacking) {
      actualDamage = Math.max(1, Math.floor(actualDamage * 0.5));
    }

    this.hp = Math.max(0, this.hp - actualDamage);
=======
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
>>>>>>> f2a20ba (Add class and input systems)
    this.damageReadyAt = time + DAMAGE_INVULNERABILITY_MS;
    this.setVelocity(knockbackX, knockbackY);
    this.setTint(0xff6b6b);
    this.scene.events.emit('player-damaged', {
      damage: actualDamage,
      x: this.x,
      y: this.y - 36,
    });

    if (this.classDefinition.canCounter && this.isAttacking && this.counterBoostEnabled && damage > 0) {
      this.heal(8);
    }

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

<<<<<<< HEAD
  createAttackHitbox(): PlayerAttackHitbox {
    if (this.classDefinition.attackType === 'ranged') {
      const spriteKey = this.classDefinition.projectileSpriteKey ?? this.classDefinition.attackSpriteKey;
      const hitbox = spriteKey && this.scene.textures.exists(spriteKey)
        ? this.scene.add.image(this.x + this.facing * 44, this.y - 4, spriteKey)
        : this.scene.add.rectangle(this.x + this.facing * 44, this.y - 4, 18, 18, 0x71d1ff, 0.92);
      hitbox.setDisplaySize(18, 18);
      this.scene.physics.add.existing(hitbox);
      const body = hitbox.body as Phaser.Physics.Arcade.Body;
      body.setAllowGravity(false);
      body.setImmovable(true);
      body.setVelocityX(this.facing * (this.classDefinition.projectileSpeed ?? 440));
      return hitbox as PlayerAttackHitbox;
    }

    const offsetX = this.facing * 34;
    const spriteKey = this.classDefinition.attackSpriteKey;
    const hitbox = spriteKey && this.scene.textures.exists(spriteKey)
      ? this.scene.add.image(this.x + offsetX, this.y - 2, spriteKey)
      : this.scene.add.rectangle(this.x + offsetX, this.y - 2, 58, 36, 0x9be7ff, 0.28);
    hitbox.setDisplaySize(58, 36);
=======
  createAttackHitbox(width = 58, height = 36, offsetX = 34, offsetY = -2, color = 0x9be7ff): PlayerAttackHitbox {
    const hitbox = this.scene.add.rectangle(this.x + this.facing * offsetX, this.y + offsetY, width, height, color, 0.28);

>>>>>>> f2a20ba (Add class and input systems)
    this.scene.physics.add.existing(hitbox);
    const body = hitbox.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    return hitbox as PlayerAttackHitbox;
  }

  getAttackDurationMs(): number {
    return this.classDefinition.attackType === 'ranged' ? 520 : ATTACK_DURATION_MS;
  }

  private handleHorizontalMovement(): void {
<<<<<<< HEAD
    const speed = this.getSpeed();
    const leftDown = this.keys.left.isDown || this.touchHold.left;
    const rightDown = this.keys.right.isDown || this.touchHold.right;
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (leftDown && !rightDown) {
      body.setVelocityX(-speed);
=======
    if (this.inputSystem.isDown('left')) {
      this.setVelocityX(-this.classDefinition.moveSpeed);
>>>>>>> f2a20ba (Add class and input systems)
      this.facing = -1;
      this.setFlipX(true);
      return;
    }

<<<<<<< HEAD
    if (rightDown && !leftDown) {
      body.setVelocityX(speed);
=======
    if (this.inputSystem.isDown('right')) {
      this.setVelocityX(this.classDefinition.moveSpeed);
>>>>>>> f2a20ba (Add class and input systems)
      this.facing = 1;
      this.setFlipX(false);
      return;
    }

    // 入力がないときは慣性を残しつつ徐々に止まる
    if (Math.abs(body.velocity.x) < 16) {
      body.setVelocityX(0);
    }
  }

  private consumeTouchRequest(action: 'jump' | 'dash' | 'attack'): boolean {
    if (!this.touchRequest[action]) {
      return false;
    }
    this.touchRequest[action] = false;
    return true;
  }

  requestTouchAction(action: 'jump' | 'dash' | 'attack'): void {
    this.touchRequest[action] = true;
  }

  requestSpecial(): void {
    this.touchRequest.special = true;
  }

  getSpecialCharge(): number {
    return this.specialCharge;
  }

  getSpecialChargeRatio(): number {
    return Phaser.Math.Clamp(this.specialCharge / this.specialChargeMax, 0, 1);
  }

  addSpecialCharge(amount: number): void {
    if (this.specialCharge >= this.specialChargeMax) {
      return;
    }
    this.specialCharge = Math.min(this.specialChargeMax, this.specialCharge + amount);
  }

  resetSpecialCharge(): void {
    this.specialCharge = 0;
  }

  applySlow(factor: number, durationMs: number): void {
    this.speedModifier = factor;
    this.setTint(0x9be7ff);
    this.scene.time.delayedCall(durationMs, () => {
      this.speedModifier = 1;
      if (!this.isDead) {
        this.clearTint();
      }
    });
  }

  private handleJump(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const maxJumpCount = this.classDefinition.maxJumpCount ?? 2;
    const canUseJump = body.blocked.down || body.touching.down || this.jumpCount < maxJumpCount;
    const wantsJump = Phaser.Input.Keyboard.JustDown(this.keys.jump) || this.consumeTouchRequest('jump');

<<<<<<< HEAD
    if (!wantsJump || !canUseJump) {
=======
    if (!this.inputSystem.justDown('jump') || !canUseJump) {
>>>>>>> f2a20ba (Add class and input systems)
      return;
    }

    this.setVelocityY(-this.classDefinition.jumpPower);
    this.jumpCount += 1;
  }

  private handleDash(time: number): void {
<<<<<<< HEAD
    const dashCooldown = this.classDefinition.dashCooldown ?? DEFAULT_DASH_COOLDOWN_MS;
    const wantsDash = Phaser.Input.Keyboard.JustDown(this.keys.dash) || this.consumeTouchRequest('dash');
    if (!wantsDash || time < this.dashReadyAt) {
=======
    if (
      !this.inputSystem.justDown('dash') ||
      time < this.dashReadyAt ||
      this.isAttacking ||
      this.isChargingIaido ||
      this.isCountering
    ) {
>>>>>>> f2a20ba (Add class and input systems)
      return;
    }

    this.isDashing = true;
    this.dashReadyAt = time + dashCooldown;
    this.setVelocity(this.facing * DASH_SPEED, 0);
    this.setTint(0x8bd3ff);
    this.play('samurai-dash', true);
    this.createDashAfterimages();

    if (this.classDefinition.id === 'winddancer') {
      this.addTempAttackBonus(5, 1400);
    }

    this.scene.time.delayedCall(DASH_DURATION_MS, () => {
      this.isDashing = false;
      if (!this.isDead) {
        this.clearTint();
      }
    });
  }

<<<<<<< HEAD
  private handleAttack(time: number): void {
    const wantsAttack = Phaser.Input.Keyboard.JustDown(this.keys.attack) || this.consumeTouchRequest('attack');
    if (!wantsAttack || time < this.attackReadyAt || this.isAttacking) {
      return;
    }

    this.isAttacking = true;
    this.attackReadyAt = time + this.getAttackCooldown();
    this.setTint(0xf7d46a);
    this.scene.events.emit('player-attack', this.createAttackHitbox());

    this.scene.time.delayedCall(this.getAttackDurationMs(), () => {
=======
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
    this.isAttacking = true;
    this.attackReadyAt = time + this.classDefinition.skills.skill1.cooldownMs;
    this.setTint(0xf7d46a);
    this.play('samurai-attack', true);
    this.scene.events.emit('player-attack', {
      hitbox: this.createAttackHitbox(isFinisher ? 72 : 58, isFinisher ? 42 : 36, isFinisher ? 42 : 34),
      damage: isFinisher ? 22 : 12 + this.comboStep * 3,
      knockbackX: isFinisher ? 360 : 260,
      knockbackY: isFinisher ? -220 : -160,
      durationMs: isFinisher ? ATTACK_DURATION_MS + 40 : ATTACK_DURATION_MS,
      effectColor: isFinisher ? 0xfff1a8 : 0xb8f3ff,
    } satisfies PlayerAttackPayload);

    this.scene.time.delayedCall(isFinisher ? ATTACK_DURATION_MS + 40 : ATTACK_DURATION_MS, () => {
>>>>>>> f2a20ba (Add class and input systems)
      this.isAttacking = false;
      if (!this.isDead) {
        this.clearTint();
      }
    });
  }

<<<<<<< HEAD
  private handleSpecial(time: number): void {
    if (!this.touchRequest.special) return;
    this.touchRequest.special = false;
    if (this.specialCharge < this.specialChargeMax || time < this.specialReadyAt) return;

    const cooldown = this.getSpecialCooldown();
    this.specialReadyAt = time + cooldown;
    this.specialCharge = 0;

    // visual feedback
    this.setTint(0xd1bbff);
    this.scene.time.delayedCall(260, () => {
      if (!this.isDead) this.clearTint();
    });

    // emit event for scene to handle class-specific special
    this.scene.events.emit('player-special', {
      classId: this.classDefinition.id,
      x: this.x,
      y: this.y,
      facing: this.facing,
      time,
    });
  }

  private getSpecialCooldown(): number {
    switch (this.classDefinition.id) {
      case 'beast':
        return 20000;
      case 'pyromancer':
        return 18000;
      case 'frostlancer':
        return 14000;
      case 'dragonblood':
        return 30000;
      case 'winddancer':
        return 9000;
      case 'machinist':
        return 30000;
      default:
        return 18000;
    }
  }

  addTempAttackBonus(amount: number, durationMs: number): void {
    this.attackBonus += amount;
    this.scene.time.delayedCall(durationMs, () => {
      this.attackBonus = Math.max(0, this.attackBonus - amount);
    });
  }

  addTempSpeedBonus(amount: number, durationMs: number): void {
    this.speedBonus += amount;
    this.scene.time.delayedCall(durationMs, () => {
      this.speedBonus = Math.max(0, this.speedBonus - amount);
=======
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
>>>>>>> f2a20ba (Add class and input systems)
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
