import Phaser from 'phaser';
import { Player } from './Player';
import { Items } from '../items/Item';

export type EnemyType = 'slime' | 'goblin' | 'archer' | 'flyer' | 'elite' | 'knight' | 'mage' | 'midboss' | 'finalBoss' | 'boss';

type EnemyConfig = {
  hp: number;
  speed: number;
  contactDamage: number;
  width: number;
  height: number;
  color: number;
  chaseDistance: number;
  stopDistance: number;
  hover?: boolean;
  ranged?: boolean;
  boss?: boolean;
  spriteKey?: string;
};

const ENEMY_CONFIGS: Record<EnemyType, EnemyConfig> = {
  slime: {
    hp: 30,
    speed: 95,
    contactDamage: 20,
    width: 34,
    height: 24,
    color: 0x6ee7a7,
    chaseDistance: 520,
    stopDistance: 24,
  },
  goblin: {
    hp: 44,
    speed: 120,
    contactDamage: 24,
    width: 34,
    height: 28,
    color: 0xcbd5e1,
    chaseDistance: 520,
    stopDistance: 28,
    spriteKey: 'enemy-goblin',
  },
  archer: {
    hp: 28,
    speed: 80,
    contactDamage: 16,
    width: 30,
    height: 30,
    color: 0xfbbf24,
    chaseDistance: 720,
    stopDistance: 220,
    ranged: true,
    spriteKey: 'enemy-archer',
  },
  flyer: {
    hp: 24,
    speed: 140,
    contactDamage: 18,
    width: 34,
    height: 26,
    color: 0x93c5fd,
    chaseDistance: 620,
    stopDistance: 30,
    hover: true,
    spriteKey: 'enemy-flyer',
  },
  elite: {
    hp: 62,
    speed: 105,
    contactDamage: 28,
    width: 38,
    height: 28,
    color: 0xf87171,
    chaseDistance: 520,
    stopDistance: 28,
    spriteKey: 'enemy-elite',
  },
  knight: {
    hp: 72,
    speed: 88,
    contactDamage: 32,
    width: 36,
    height: 34,
    color: 0x7c3aed,
    chaseDistance: 520,
    stopDistance: 30,
    spriteKey: 'enemy-knight',
  },
  mage: {
    hp: 38,
    speed: 84,
    contactDamage: 22,
    width: 32,
    height: 34,
    color: 0xa855f7,
    chaseDistance: 760,
    stopDistance: 180,
    ranged: true,
    spriteKey: 'enemy-mage',
  },
  midboss: {
    hp: 160,
    speed: 76,
    contactDamage: 38,
    width: 74,
    height: 60,
    color: 0xf97316,
    chaseDistance: 680,
    stopDistance: 72,
    boss: true,
    spriteKey: 'enemy-midboss',
  },
  finalBoss: {
    hp: 360,
    speed: 68,
    contactDamage: 48,
    width: 84,
    height: 72,
    color: 0xdb2777,
    chaseDistance: 760,
    stopDistance: 100,
    ranged: true,
    boss: true,
    spriteKey: 'enemy-finalBoss',
  },
  boss: {
    hp: 240,
    speed: 70,
    contactDamage: 40,
    width: 70,
    height: 58,
    color: 0x8b5cf6,
    chaseDistance: 680,
    stopDistance: 80,
    ranged: true,
    boss: true,
    spriteKey: 'enemy-boss',
  },
};

export const enemySpriteKeys = Object.values(ENEMY_CONFIGS)
  .map((config) => config.spriteKey)
  .filter((key): key is string => Boolean(key));

const ENEMY_ATTACK_COOLDOWN = 760;
const ENEMY_DAMAGE_INVULNERABILITY_MS = 180;

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  protected readonly config: EnemyConfig;
  protected readonly enemyType: EnemyType;
  private hp: number;
  private damageReadyAt = 0;
  private isDead = false;
  private slowMultiplier = 1;
  private frozenUntil = 0;
  private bleedTimers: Phaser.Time.TimerEvent[] = [];
  private readonly healthBarBack: Phaser.GameObjects.Rectangle;
  private readonly healthBarFill: Phaser.GameObjects.Rectangle;
  private attackCooldownAt = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, type: EnemyType) {
    super(scene, x, y, 'enemy-placeholder');
    this.enemyType = type;
    this.config = ENEMY_CONFIGS[type];
    this.hp = this.config.hp;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setDragX(900);
    this.setMaxVelocity(260, 700);
    this.setSize(this.config.width, this.config.height);
    this.setOffset((48 - this.config.width) / 2, (48 - this.config.height) / 2);
    this.setScale(this.config.width / 48, this.config.height / 48);
    const textureKey = this.config.spriteKey ?? 'enemy-placeholder';
    if (this.scene.textures.exists(textureKey)) {
      this.setTexture(textureKey);
    } else {
      this.setTexture('enemy-placeholder');
      this.setTint(this.config.color);
      if (this.config.spriteKey) {
        this.scene.textures.on('addtexture', (texture: Phaser.Textures.Texture) => {
          if (texture.key === this.config.spriteKey) {
            this.setTexture(texture.key);
            this.clearTint();
          }
        });
      }
    }

    this.healthBarBack = scene.add.rectangle(x, y - this.config.height / 2 - 20, this.config.width + 6, 6, 0x1f2933);
    this.healthBarBack.setDepth(20);
    this.healthBarFill = scene.add.rectangle(x - (this.config.width + 6) / 2 + 3, y - this.config.height / 2 - 20, this.config.width, 4, 0x7ff0b2);
    this.healthBarFill.setDepth(21);
  }

  update(player: Player): void {
    if (this.isDead || player.getIsDead()) {
      this.setVelocity(0, 0);
      return;
    }

    if (this.scene.time.now < this.frozenUntil) {
      // frozen: don't move or act
      return;
    }

    this.updateHealthBar();

    const distanceX = player.x - this.x;
    const distanceY = (player.y - this.y) * (this.config.hover ? 0.6 : 1);
    const distance = Math.hypot(distanceX, distanceY);

    if (distance > this.config.chaseDistance) {
      this.setVelocityX(0);
      return;
    }

    const direction = Math.sign(distanceX) || 1;

    if (this.config.ranged && distance < this.config.stopDistance) {
      this.setVelocityX(0);
      if (this.scene.time.now >= this.attackCooldownAt) {
        this.attackCooldownAt = this.scene.time.now + ENEMY_ATTACK_COOLDOWN;
        const projectile = this.scene.add.rectangle(this.x + direction * 26, this.y - 6, 16, 16, 0xffffff);
        this.scene.physics.add.existing(projectile);
        const body = projectile.body as Phaser.Physics.Arcade.Body;
        body.setAllowGravity(false);
        body.setImmovable(true);
        body.setVelocityX(direction * 260);
        body.setSize(14, 14);
        body.onWorldBounds = true;

        this.scene.physics.add.overlap(projectile, player, () => {
          player.takeDamage(this.config.contactDamage, direction * 180, -80, this.scene.time.now);
          projectile.destroy();
        });

        this.scene.time.delayedCall(1400, () => {
          projectile.destroy();
        });
      }
      return;
    }

    if (Math.abs(distanceX) > this.config.stopDistance) {
      this.setVelocityX(direction * this.config.speed * this.slowMultiplier);
      this.setFlipX(direction < 0);
    } else {
      this.setVelocityX(0);
    }

    if (this.config.hover) {
      const hoverTarget = this.y + Math.sin(this.scene.time.now / 320) * 12;
      this.setVelocityY(hoverTarget - this.y);
    }
  }

  takeDamage(damage: number, knockbackX: number, knockbackY: number, time: number): boolean {
    if (this.isDead || time < this.damageReadyAt) {
      return false;
    }

    this.hp = Math.max(0, this.hp - damage);
    this.damageReadyAt = time + ENEMY_DAMAGE_INVULNERABILITY_MS;
    this.setVelocity(knockbackX, knockbackY);
    this.setTint(0xfff0a3);
    this.scene.events.emit('enemy-damaged', {
      damage,
      x: this.x,
      y: this.y - 28,
    });

    if (this.hp <= 0) {
      this.die();
      return true;
    }

    this.scene.time.delayedCall(120, () => {
      if (!this.isDead) {
        this.setTint(this.config.color);
      }
    });

    this.updateHealthBar();
    return true;
  }

  applySlow(factor: number, durationMs: number): void {
    this.slowMultiplier = factor;
    this.setTint(0x9be7ff);
    this.scene.time.delayedCall(durationMs, () => {
      this.slowMultiplier = 1;
      if (!this.isDead) this.setTint(this.config.color);
    });
  }

  applyFreeze(durationMs: number): void {
    this.frozenUntil = this.scene.time.now + durationMs;
    this.setTint(0xbfeeff);
    this.scene.time.delayedCall(durationMs, () => {
      if (!this.isDead) this.setTint(this.config.color);
    });
  }

  applyBleed(totalDamage: number, durationMs: number): void {
    const ticks = 3;
    const perTick = Math.max(1, Math.floor(totalDamage / ticks));
    const interval = Math.floor(durationMs / ticks);
    const timers: Phaser.Time.TimerEvent[] = [];
    for (let i = 1; i <= ticks; i++) {
      const t = this.scene.time.delayedCall(interval * i, () => {
        if (this.isDead) return;
        this.takeDamage(perTick, 0, -40, this.scene.time.now);
      });
      timers.push(t);
    }
    this.bleedTimers.push(...timers);
  }

  getContactDamage(): number {
    return this.config.contactDamage;
  }

  getHp(): number {
    return this.hp;
  }

  getMaxHp(): number {
    return this.config.hp;
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
    this.dropLoot();

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 0.72,
      scaleY: 0.72,
      duration: 240,
      onComplete: () => {
        this.healthBarBack.destroy();
        this.healthBarFill.destroy();
        this.destroy();
        this.scene.events.emit('enemy-defeated');
      },
    });
  }

  private dropLoot(): void {
    const chance = Math.random();
    if (this.config.boss) {
      this.scene.events.emit('item-drop', { x: this.x, y: this.y, itemId: Items.rareArtifact.id });
      return;
    }

    if (this.enemyType === 'elite') {
      if (chance < 0.24) {
        this.scene.events.emit('item-drop', { x: this.x, y: this.y, itemId: Items.strengthElixir.id });
        return;
      }
    }

    if (this.enemyType === 'archer' || this.enemyType === 'flyer') {
      if (chance < 0.18) {
        this.scene.events.emit('item-drop', { x: this.x, y: this.y, itemId: Items.speedTonic.id });
        return;
      }
    }

    if (this.enemyType === 'goblin') {
      if (chance < 0.16) {
        this.scene.events.emit('item-drop', { x: this.x, y: this.y, itemId: Items.strengthElixir.id });
        return;
      }
    }

    if (chance < 0.24) {
      this.scene.events.emit('item-drop', { x: this.x, y: this.y, itemId: Items.potion.id });
    }
  }

  private updateHealthBar(): void {
    const ratio = Phaser.Math.Clamp(this.hp / this.config.hp, 0, 1);
    const width = Math.max(4, (this.config.width + 6) * ratio);

    this.healthBarBack.setPosition(this.x, this.y - this.config.height / 2 - 20);
    this.healthBarFill.setPosition(this.x - (this.config.width + 6) / 2 + width / 2, this.y - this.config.height / 2 - 20);
    this.healthBarFill.setSize(width, 4);
    this.healthBarFill.setFillStyle(ratio <= 0.35 ? 0xf87171 : 0x7ff0b2);
  }
}
