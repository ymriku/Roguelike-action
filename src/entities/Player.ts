import Phaser from 'phaser';
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
const DASH_SPEED = 620;
const DASH_DURATION_MS = 160;
const DEFAULT_DASH_COOLDOWN_MS = 420;
const DASH_AFTERIMAGE_INTERVAL_MS = 32;
const ATTACK_DURATION_MS = 110;
const DAMAGE_INVULNERABILITY_MS = 650;

export type PlayerAttackHitbox = Phaser.GameObjects.Rectangle & {
  body: Phaser.Physics.Arcade.Body;
};

export class Player extends Phaser.Physics.Arcade.Sprite {
  private readonly keys: MovementKeys;
  private readonly classDefinition: ClassDefinition;
  private jumpCount = 0;
  private facing: -1 | 1 = 1;
  private isDashing = false;
  private isAttacking = false;
  private isDead = false;
  private currentAnimationKey?: string;
  private dashReadyAt = 0;
  private attackReadyAt = 0;
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
    this.setSize(28, 42);
    this.setOffset(10, 6);
    this.specialReadyAt = 0;
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
      return;
    }

    this.handleHorizontalMovement();
    this.handleJump();
    this.handleDash(time);
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
  }

  getFacing(): -1 | 1 {
    return this.facing;
  }

  getHp(): number {
    return this.hp;
  }

  getMaxHp(): number {
    return this.classDefinition.hp + this.maxHpBonus;
  }

  getIsDead(): boolean {
    return this.isDead;
  }

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
  }

  takeDamage(damage: number, knockbackX: number, knockbackY: number, time: number): boolean {
    if (this.isDead || this.isDashing || time < this.damageReadyAt) {
      return false;
    }

    let actualDamage = damage;
    if (this.classDefinition.id === 'dragonblood') {
      actualDamage = Math.max(1, Math.floor(damage * 0.85));
    }
    if (this.classDefinition.canCounter && this.isAttacking) {
      actualDamage = Math.max(1, Math.floor(actualDamage * 0.5));
    }

    this.hp = Math.max(0, this.hp - actualDamage);
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
    const speed = this.getSpeed();
    const leftDown = this.keys.left.isDown || this.touchHold.left;
    const rightDown = this.keys.right.isDown || this.touchHold.right;
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (leftDown && !rightDown) {
      body.setVelocityX(-speed);
      this.facing = -1;
      this.setFlipX(true);
      return;
    }

    if (rightDown && !leftDown) {
      body.setVelocityX(speed);
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

    if (!wantsJump || !canUseJump) {
      return;
    }

    this.setVelocityY(-JUMP_SPEED);
    this.jumpCount += 1;
  }

  private handleDash(time: number): void {
    const dashCooldown = this.classDefinition.dashCooldown ?? DEFAULT_DASH_COOLDOWN_MS;
    const wantsDash = Phaser.Input.Keyboard.JustDown(this.keys.dash) || this.consumeTouchRequest('dash');
    if (!wantsDash || time < this.dashReadyAt) {
      return;
    }

    this.isDashing = true;
    this.dashReadyAt = time + dashCooldown;
    this.setVelocity(this.facing * DASH_SPEED, 0);
    this.setTint(0x8bd3ff);
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
      this.isAttacking = false;
      if (!this.isDead) {
        this.clearTint();
      }
    });
  }

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
