import Phaser from 'phaser';
import { ClassDefinition, DEFAULT_CLASS_ID, PlayerClassId, classList, getClassDefinition } from '../classes';
import { Enemy, enemyAnimationKeys, enemyTypes } from '../entities/Enemy';
import { Player, PlayerAttackPayload, PlayerProjectilePayload } from '../entities/Player';
import { InputAction, InputSystem } from '../systems/InputSystem';
import { SaveSystem } from '../systems/SaveSystem';
import {
  GeneratedStage,
  PlatformDefinition,
  TrapDefinition,
  TrapKind,
  createRunSeed,
  generateStage,
  readSeedFromLocation,
} from '../systems/StageGenerator';

const PLAYER_ANIMATION_KEYS = ['idle', 'run', 'attack', 'dash'] as const;
const PLAYER_SPRITE_URLS = Object.fromEntries(
  classList.map((classDef) => [
    classDef.id,
    Object.fromEntries(
      PLAYER_ANIMATION_KEYS.map((animation) => [
        animation,
        new URL(`../../assets/sprites/player/${classDef.id}/${animation}.png`, import.meta.url).toString(),
      ]),
    ),
  ]),
) as Record<PlayerClassId, Record<(typeof PLAYER_ANIMATION_KEYS)[number], string>>;

const TILE_URLS = {
  ground: new URL('../../assets/tiles/ground.png', import.meta.url).toString(),
  ledge: new URL('../../assets/tiles/ledge.png', import.meta.url).toString(),
  secret: new URL('../../assets/tiles/secret.png', import.meta.url).toString(),
  background: new URL('../../assets/backgrounds/cavern.png', import.meta.url).toString(),
};

const TRAP_URLS: Record<TrapKind, string> = {
  fire: new URL('../../assets/sprites/traps/spikes.png', import.meta.url).toString(),
  ice: new URL('../../assets/sprites/traps/rune.png', import.meta.url).toString(),
};

const ENEMY_SPRITE_URLS = Object.fromEntries(
  enemyTypes.map((enemyType) => [
    enemyType,
    Object.fromEntries(
      enemyAnimationKeys.map((animation) => [
        animation,
        new URL(`../../assets/sprites/enemies/${enemyType}/${animation}.png`, import.meta.url).toString(),
      ]),
    ),
  ]),
) as Record<(typeof enemyTypes)[number], Record<(typeof enemyAnimationKeys)[number], string>>;

type DamagePopupEvent = {
  damage: number;
  x: number;
  y: number;
};

type GameSceneData = {
  stageIndex?: number;
  runSeed?: string;
  selectedClassId?: PlayerClassId;
};

export class GameScene extends Phaser.Scene {
  private player?: Player;
  private enemies?: Phaser.GameObjects.Group;
  private goalZone?: Phaser.GameObjects.Zone;
  private currentStage?: GeneratedStage;
  private inputSystem?: InputSystem;
  private selectedClass?: ClassDefinition;
  private playerHpBarFill?: Phaser.GameObjects.Rectangle;
  private hpText?: Phaser.GameObjects.Text;
  private enemiesText?: Phaser.GameObjects.Text;
  private stageText?: Phaser.GameObjects.Text;
  private classText?: Phaser.GameObjects.Text;
  private seedText?: Phaser.GameObjects.Text;
  private gameStateText?: Phaser.GameObjects.Text;
  private restartText?: Phaser.GameObjects.Text;
  private nextStageText?: Phaser.GameObjects.Text;
  private redFlash?: Phaser.GameObjects.Rectangle;
  private stagePlatforms?: Phaser.Physics.Arcade.StaticGroup;
  private skillCooldownUi: Array<{
    id: string;
    label: Phaser.GameObjects.Text;
    back: Phaser.GameObjects.Rectangle;
    fill: Phaser.GameObjects.Rectangle;
    value: Phaser.GameObjects.Text;
  }> = [];
  private remainingEnemies = 0;
  private stageIndex = 1;
  private runSeed = '';
  private isGameOver = false;
  private isStageClear = false;
  private restartKey?: Phaser.Input.Keyboard.Key;

  constructor() {
    super('GameScene');
  }

  preload(): void {
    for (const classDef of classList) {
      for (const animation of PLAYER_ANIMATION_KEYS) {
        this.load.spritesheet(`${classDef.id}-${animation}`, PLAYER_SPRITE_URLS[classDef.id][animation], {
          frameWidth: 32,
          frameHeight: 32,
        });
      }
    }
    this.load.image('tile-ground', TILE_URLS.ground);
    this.load.image('tile-ledge', TILE_URLS.ledge);
    this.load.image('tile-secret', TILE_URLS.secret);
    this.load.image('background-cavern', TILE_URLS.background);
    this.load.image('trap-fire', TRAP_URLS.fire);
    this.load.image('trap-ice', TRAP_URLS.ice);
    for (const enemyType of enemyTypes) {
      for (const animation of enemyAnimationKeys) {
        this.load.spritesheet(`enemy-${enemyType}-${animation}`, ENEMY_SPRITE_URLS[enemyType][animation], {
          frameWidth: 32,
          frameHeight: 32,
        });
      }
    }
    this.createPlaceholderEnemyTexture();
  }

  create(data?: GameSceneData): void {
    this.createPlayerAnimations();
    this.createEnemyAnimations();

    this.stageIndex = data?.stageIndex ?? 1;
    this.runSeed = data?.runSeed ?? readSeedFromLocation(window.location) ?? createRunSeed();
    const selectedClassId = data?.selectedClassId ?? SaveSystem.getSelectedClassId() ?? DEFAULT_CLASS_ID;
    SaveSystem.setSelectedClassId(selectedClassId);
    this.selectedClass = getClassDefinition(selectedClassId);
    this.currentStage = generateStage(this.stageIndex, this.runSeed);
    this.inputSystem = new InputSystem(this);
    this.isGameOver = false;
    this.isStageClear = false;
    this.skillCooldownUi = [];

    const { worldWidth, worldHeight, start } = this.currentStage;
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.createPixelBackground(worldWidth, worldHeight);

    const platforms = this.createStageBlockout(this.currentStage.platforms);
    this.stagePlatforms = platforms;
    this.createGoal(this.currentStage);

    this.restartKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.player = new Player(this, start.x, start.y, this.inputSystem, this.selectedClass);
    this.physics.add.collider(this.player, platforms);

    this.enemies = this.createEnemies(this.currentStage);
    this.physics.add.collider(this.enemies, platforms);
    this.physics.add.overlap(this.player, this.enemies, this.handlePlayerEnemyContact, undefined, this);

    this.createStageTraps(this.currentStage.trapSpawns);

    if (!this.goalZone) {
      throw new Error('Stage goal is required.');
    }
    this.physics.add.overlap(this.player, this.goalZone, this.handleGoalReached, undefined, this);

    this.events.off('player-attack', this.handlePlayerAttack, this);
    this.events.off('player-projectile', this.handlePlayerProjectile, this);
    this.events.off('player-counter', this.handlePlayerCounter, this);
    this.events.off('player-damaged', this.handlePlayerDamaged, this);
    this.events.off('enemy-damaged', this.handleEnemyDamaged, this);
    this.events.off('player-dead', this.handlePlayerDead, this);
    this.events.off('enemy-defeated', this.handleEnemyDefeated, this);
    this.events.on('player-attack', this.handlePlayerAttack, this);
    this.events.on('player-projectile', this.handlePlayerProjectile, this);
    this.events.on('player-counter', this.handlePlayerCounter, this);
    this.events.on('player-damaged', this.handlePlayerDamaged, this);
    this.events.on('enemy-damaged', this.handleEnemyDamaged, this);
    this.events.on('player-dead', this.handlePlayerDead, this);
    this.events.on('enemy-defeated', this.handleEnemyDefeated, this);

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setDeadzone(120, 80);

    this.addControlsText();
    this.addHud();
    this.addTouchControls();
    this.updateHud();
  }

  update(time: number): void {
    if (this.isGameOver && this.restartKey && Phaser.Input.Keyboard.JustDown(this.restartKey)) {
      this.inputSystem?.endFrame();
      this.restartStage();
      return;
    }

    this.player?.update(time);
    this.checkPlayerFallOut();

    if (this.player && this.enemies) {
      for (const enemy of [...this.enemies.getChildren()]) {
        if (enemy instanceof Enemy && enemy.active && !enemy.getIsDead()) {
          enemy.update(this.player);
          this.rescueEnemyIfOutOfBounds(enemy);
        }
      }
    }

    this.updateHud();
    this.inputSystem?.endFrame();
  }

  private createPlaceholderEnemyTexture(): void {
    const graphics = this.make.graphics({ x: 0, y: 0 }, false);
    graphics.fillStyle(0x6ee7a7);
    graphics.fillEllipse(24, 32, 40, 28);
    graphics.fillStyle(0x34a46f);
    graphics.fillEllipse(24, 25, 30, 18);
    graphics.fillStyle(0x101820);
    graphics.fillRect(15, 25, 4, 4);
    graphics.fillRect(29, 25, 4, 4);
    graphics.generateTexture('enemy-placeholder', 48, 48);
    graphics.destroy();
  }

  private createPlayerAnimations(): void {
    for (const classDef of classList) {
      this.createPlayerAnimation(`${classDef.id}-idle`, 3, 5, -1);
      this.createPlayerAnimation(`${classDef.id}-run`, 5, 10, -1);
      this.createPlayerAnimation(`${classDef.id}-attack`, 5, 18, 0);
      this.createPlayerAnimation(`${classDef.id}-dash`, 3, 16, -1);
    }
  }

  private createStageBlockout(platformDefinitions: PlatformDefinition[]): Phaser.Physics.Arcade.StaticGroup {
    const platforms = this.physics.add.staticGroup();

    for (const definition of platformDefinitions) {
      const textureKey = `tile-${definition.kind}`;
      const platform = this.add.tileSprite(
        definition.x,
        definition.y,
        definition.width,
        definition.height,
        textureKey,
      );
      platform.setDepth(4);
      platforms.add(platform);
    }

    platforms.refresh();
    return platforms;
  }

  private createPixelBackground(worldWidth: number, worldHeight: number): void {
    const background = this.add.tileSprite(0, 0, worldWidth, worldHeight, 'background-cavern');
    background.setOrigin(0, 0);
    background.setDepth(-20);
  }

  private createPlayerAnimation(key: string, endFrame: number, frameRate: number, repeat: number): void {
    if (this.anims.exists(key)) {
      return;
    }

    this.anims.create({
      key,
      frames: this.anims.generateFrameNumbers(key, { start: 0, end: endFrame }),
      frameRate,
      repeat,
    });
  }

  private createEnemyAnimations(): void {
    for (const enemyType of enemyTypes) {
      this.createEnemyAnimation(`enemy-${enemyType}-idle`, 3, 5, -1);
      this.createEnemyAnimation(`enemy-${enemyType}-walk`, 5, 8, -1);
      this.createEnemyAnimation(`enemy-${enemyType}-attack`, 4, 12, 0);
      this.createEnemyAnimation(`enemy-${enemyType}-hurt`, 2, 14, 0);
      this.createEnemyAnimation(`enemy-${enemyType}-death`, 4, 10, 0);
    }
  }

  private createEnemyAnimation(key: string, endFrame: number, frameRate: number, repeat: number): void {
    if (this.anims.exists(key)) {
      return;
    }

    this.anims.create({
      key,
      frames: this.anims.generateFrameNumbers(key, { start: 0, end: endFrame }),
      frameRate,
      repeat,
    });
  }

  private createStageTraps(traps: TrapDefinition[]): void {
    if (!this.player || !this.enemies) {
      return;
    }

    for (const trap of traps) {
      const trapSprite = this.add.tileSprite(
        trap.x,
        trap.y,
        trap.width,
        trap.height,
        `trap-${trap.kind}`,
      );
      trapSprite.setDepth(16);
      this.physics.add.existing(trapSprite, false);
      const body = trapSprite.body as Phaser.Physics.Arcade.Body;
      body.setAllowGravity(false);
      body.setImmovable(true);
      body.setSize(trap.width, trap.height);
      trapSprite.setData('kind', trap.kind);
      trapSprite.setData('lastTrigger', 0);

      this.physics.add.overlap(this.player, trapSprite, (_playerObject, trapObject) => {
        const trapGameObject = trapObject as Phaser.GameObjects.GameObject;
        const kind = trapGameObject.getData('kind') as TrapKind;
        const last = trapGameObject.getData('lastTrigger') as number;
        const now = this.time.now;
        if (now < last + 500) {
          return;
        }
        trapGameObject.setData('lastTrigger', now);
        if (kind === 'fire') {
          this.player?.takeDamage(10, 0, -80, now);
        } else {
          this.player?.applySlow(0.5, 1200);
        }
      });

    }
  }

  private createEnemies(stage: GeneratedStage): Phaser.GameObjects.Group {
    const enemies = this.add.group();

    for (const spawn of stage.enemySpawns) {
      const enemy = new Enemy(this, spawn.x, spawn.y, spawn.type);
      const patrolPlatform = this.findNearestSafePlatform(spawn.x);
      if (patrolPlatform) {
        const body = enemy.body as Phaser.Physics.Arcade.Body;
        const left = patrolPlatform.x - patrolPlatform.width / 2 + body.width / 2 + 8;
        const right = patrolPlatform.x + patrolPlatform.width / 2 - body.width / 2 - 8;
        const safeX = Phaser.Math.Clamp(spawn.x, left + 16, right - 16);
        const safeY = patrolPlatform.y - patrolPlatform.height / 2 - body.height / 2 - 8;
        enemy.setPatrolBounds(left, right, safeX, safeY);
      }
      enemies.add(enemy);
    }

    this.remainingEnemies = stage.enemySpawns.length;
    return enemies;
  }

  private createGoal(stage: GeneratedStage): void {
    const goal = this.add.zone(stage.goal.x, stage.goal.y, 48, 72);
    this.physics.add.existing(goal, true);
    this.goalZone = goal;

    const marker = this.add.rectangle(stage.goal.x, stage.goal.y, 42, 66, 0xfbbf24, 0.38);
    marker.setDepth(12);
    this.tweens.add({
      targets: marker,
      alpha: 0.7,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });
  }

  private addControlsText(): void {
    const text = this.add.text(16, 512, 'A/D or Arrow: Move  Space/Up: Jump  F/J: Attack  Shift: Dash  Z/X/C or K/L/I: Skills', {
      color: '#cbd5e1',
      fontFamily: 'monospace',
      fontSize: '13px',
    });
    text.setScrollFactor(0);
    text.setDepth(60);
  }

  private addHud(): void {
    const back = this.add.rectangle(0, 0, 960, 88, 0x08101a, 0.74);
    back.setOrigin(0, 0);
    back.setScrollFactor(0);
    back.setDepth(50);

    this.add.rectangle(16, 28, 180, 14, 0x1f2933).setOrigin(0, 0.5).setScrollFactor(0).setDepth(52);
    this.playerHpBarFill = this.add.rectangle(16, 28, 180, 10, 0x7ff0b2);
    this.playerHpBarFill.setOrigin(0, 0.5).setScrollFactor(0).setDepth(53);

    this.hpText = this.add.text(16, 42, '', { color: '#e2e8f0', fontFamily: 'monospace', fontSize: '13px' });
    this.enemiesText = this.add.text(220, 18, '', { color: '#e2e8f0', fontFamily: 'monospace', fontSize: '14px' });
    this.stageText = this.add.text(220, 42, '', { color: '#cbd5e1', fontFamily: 'monospace', fontSize: '13px' });
    this.classText = this.add.text(420, 18, '', { color: '#e2e8f0', fontFamily: 'monospace', fontSize: '14px' });
    this.seedText = this.add.text(420, 42, '', { color: '#94a3b8', fontFamily: 'monospace', fontSize: '12px' });
    this.gameStateText = this.add.text(480, 104, '', { color: '#fbbf24', fontFamily: 'monospace', fontSize: '22px', fontStyle: 'bold' });
    this.redFlash = this.add.rectangle(0, 0, 960, 540, 0xff0000, 0);

    for (const item of [this.hpText, this.enemiesText, this.stageText, this.classText, this.seedText, this.gameStateText, this.redFlash]) {
      item?.setScrollFactor(0);
      item?.setDepth(54);
    }
    this.gameStateText.setOrigin(0.5);
    this.redFlash.setOrigin(0, 0);
    this.redFlash.setDepth(95);
    this.skillCooldownUi = this.createSkillCooldownUi();
  }

  private updateHud(): void {
    if (!this.player || !this.selectedClass) {
      return;
    }

    const hpRatio = Phaser.Math.Clamp(this.player.getHp() / this.player.getMaxHp(), 0, 1);
    this.playerHpBarFill?.setSize(180 * hpRatio, 10);
    this.playerHpBarFill?.setFillStyle(hpRatio <= 0.35 ? 0xf87171 : 0x7ff0b2);
    this.hpText?.setText(`HP ${this.player.getHp()} / ${this.player.getMaxHp()}`);
    this.enemiesText?.setText(`Enemies: ${this.remainingEnemies}`);
    this.stageText?.setText(`Stage: ${this.stageIndex}`);
    this.classText?.setText(`Class: ${this.selectedClass.name}`);
    this.seedText?.setText(`Seed: ${this.runSeed}`);
    this.updateSkillCooldownUi();
  }

  private handlePlayerAttack(payload: PlayerAttackPayload): void {
    this.resolvePlayerAttack(payload);
  }

  private handlePlayerProjectile(payload: PlayerProjectilePayload): void {
    this.spawnPlayerProjectile(payload);
  }

  private handlePlayerCounter(payload: PlayerAttackPayload): void {
    this.showCounterEffect(payload.hitbox.x, payload.hitbox.y);
    this.resolvePlayerAttack(payload);
  }

  private resolvePlayerAttack(payload: PlayerAttackPayload): void {
    if (!this.enemies || !this.player) {
      payload.hitbox.destroy();
      return;
    }

    const hitEnemies = new Set<Enemy>();
    const hitEnemy = (_hitbox: unknown, target: unknown): void => {
      if (!(target instanceof Enemy) || !target.active || target.getIsDead() || hitEnemies.has(target)) {
        return;
      }

      hitEnemies.add(target);
      const direction = this.player?.getFacing() ?? 1;
      target.takeDamage(payload.damage, direction * payload.knockbackX, payload.knockbackY, this.time.now);
      this.applyAttackStatus(target, payload.status, payload.statusDurationMs);
      this.showAttackEffect(target.x, target.y, payload.effectColor);
    };
    const overlap = this.physics.add.overlap(payload.hitbox, this.enemies, hitEnemy);
    this.physics.overlap(payload.hitbox, this.enemies, hitEnemy);

    this.time.delayedCall(payload.durationMs, () => {
      overlap.destroy();
      if (payload.hitbox.active) {
        payload.hitbox.destroy();
      }
    });
  }

  private spawnPlayerProjectile(payload: PlayerProjectilePayload): void {
    if (!this.enemies) {
      return;
    }

    const projectile = this.add.rectangle(payload.x, payload.y, payload.width, payload.height, payload.color, 0.92);
    projectile.setDepth(34);
    this.physics.add.existing(projectile);
    const body = projectile.body as Phaser.Physics.Arcade.Body;
    const collisionWidth = Math.max(payload.width, payload.kind === 'bullet' ? 24 : payload.width);
    const collisionHeight = Math.max(payload.height, payload.kind === 'bullet' ? 12 : payload.height);
    body.setAllowGravity(payload.allowGravity);
    body.setVelocity(payload.velocityX, payload.velocityY);
    body.setSize(collisionWidth, collisionHeight);
    body.setImmovable(!payload.allowGravity);
    body.setBounce(0);

    const flare = this.add.circle(payload.x, payload.y, Math.max(payload.width, payload.height), payload.color, 0.28);
    flare.setDepth(33);
    this.tweens.add({
      targets: flare,
      alpha: 0,
      scaleX: 1.9,
      scaleY: 1.9,
      duration: 180,
      ease: 'Quad.easeOut',
      onComplete: () => flare.destroy(),
    });

    let enemyOverlap: Phaser.Physics.Arcade.Collider | undefined;
    let terrainCollider: Phaser.Physics.Arcade.Collider | undefined;

    const cleanup = (): void => {
      enemyOverlap?.destroy();
      terrainCollider?.destroy();
    };

    const explode = (x: number, y: number): void => {
      if (!projectile.active) {
        return;
      }
      cleanup();
      projectile.destroy();
      if (!payload.explosionRadius || payload.explosionRadius <= 0) {
        return;
      }
      this.resolveAreaDamage(x, y, payload.explosionRadius, payload);
      this.showExplosionEffect(x, y, payload.explosionRadius, payload.color);
    };

    const hitEnemy = (_projectile: unknown, target: unknown): void => {
      if (!(target instanceof Enemy) || !target.active || target.getIsDead()) {
        return;
      }

      if (payload.explosionRadius && payload.explosionRadius > 0) {
        explode(projectile.x, projectile.y);
        return;
      }

      const direction = Math.sign(payload.velocityX) || 1;
      target.takeDamage(payload.damage, direction * payload.knockbackX, payload.knockbackY, this.time.now);
      this.applyAttackStatus(target, payload.status, payload.statusDurationMs);
      this.showAttackEffect(target.x, target.y, payload.color);
      cleanup();
      projectile.destroy();
    };
    enemyOverlap = this.physics.add.overlap(projectile, this.enemies, hitEnemy);

    if (this.stagePlatforms) {
      terrainCollider = this.physics.add.collider(projectile, this.stagePlatforms, () => {
        explode(projectile.x, projectile.y);
      });
    }

    this.physics.overlap(projectile, this.enemies, hitEnemy);

    this.time.delayedCall(payload.durationMs, () => {
      if (projectile.active) {
        explode(projectile.x, projectile.y);
      } else {
        cleanup();
      }
    });
  }

  private resolveAreaDamage(x: number, y: number, radius: number, payload: PlayerProjectilePayload): void {
    if (!this.enemies) {
      return;
    }

    const direction = Math.sign(payload.velocityX) || this.player?.getFacing() || 1;
    for (const target of this.enemies.getChildren()) {
      if (!(target instanceof Enemy) || !target.active || target.getIsDead()) {
        continue;
      }
      if (Phaser.Math.Distance.Between(x, y, target.x, target.y) > radius) {
        continue;
      }

      target.takeDamage(payload.damage, direction * payload.knockbackX, payload.knockbackY, this.time.now);
      this.applyAttackStatus(target, payload.status, payload.statusDurationMs);
    }
  }

  private applyAttackStatus(enemy: Enemy, status?: PlayerAttackPayload['status'], durationMs = 900): void {
    if (!status) {
      return;
    }

    if (status === 'freeze') {
      enemy.applyFreeze(durationMs);
    } else if (status === 'slow') {
      enemy.applySlow(0.45, durationMs);
    } else if (status === 'bleed') {
      enemy.applyBleed(9, durationMs);
    } else if (status === 'burn') {
      enemy.applyBleed(12, durationMs);
    }
  }

  private handlePlayerEnemyContact(
    playerObject:
      | Phaser.Types.Physics.Arcade.GameObjectWithBody
      | Phaser.Physics.Arcade.Body
      | Phaser.Physics.Arcade.StaticBody
      | Phaser.Tilemaps.Tile,
    enemyObject:
      | Phaser.Types.Physics.Arcade.GameObjectWithBody
      | Phaser.Physics.Arcade.Body
      | Phaser.Physics.Arcade.StaticBody
      | Phaser.Tilemaps.Tile,
  ): void {
    if (!(playerObject instanceof Player) || !(enemyObject instanceof Enemy) || enemyObject.getIsDead()) {
      return;
    }

    const direction = Math.sign(playerObject.x - enemyObject.x) || 1;
    playerObject.takeDamage(enemyObject.getContactDamage(), direction * 360, -220, this.time.now);
  }

  private handleEnemyDefeated(): void {
    this.remainingEnemies = Math.max(0, this.remainingEnemies - 1);

    if (this.remainingEnemies === 0 && this.gameStateText) {
      this.gameStateText.setText('Goal Open');
    }
  }

  private handleGoalReached(): void {
    if (this.isGameOver || this.isStageClear || this.remainingEnemies > 0) {
      return;
    }

    this.isStageClear = true;
    this.gameStateText?.setText('Stage Clear');
    this.showNextStageButton();
  }

  private handlePlayerDead(): void {
    this.isGameOver = true;
    this.gameStateText?.setText('Game Over');
    this.showRestartButton();
  }

  private handlePlayerDamaged(event: DamagePopupEvent): void {
    this.showDamageNumber(event.x, event.y, event.damage, '#ff8a8a');
    this.flashRed();
  }

  private handleEnemyDamaged(event: DamagePopupEvent): void {
    this.showDamageNumber(event.x, event.y, event.damage, '#ffe082');
  }

  private showDamageNumber(x: number, y: number, damage: number, color: string): void {
    const text = this.add.text(x, y, `-${damage}`, {
      color,
      fontFamily: 'DotGothic16, monospace',
      fontSize: '18px',
      fontStyle: 'bold',
      stroke: '#101820',
      strokeThickness: 3,
    });

    text.setOrigin(0.5);
    text.setDepth(90);

    this.tweens.add({
      targets: text,
      y: y - 34,
      alpha: 0,
      duration: 520,
      ease: 'Quad.easeOut',
      onComplete: () => {
        text.destroy();
      },
    });
  }

  private flashRed(): void {
    if (!this.redFlash) {
      return;
    }

    this.redFlash.setAlpha(0.24);
    this.tweens.add({
      targets: this.redFlash,
      alpha: 0,
      duration: 180,
      ease: 'Quad.easeOut',
    });
  }

  private showAttackEffect(x: number, y: number, color = 0xb8f3ff): void {
    const effect = this.add.ellipse(x, y, 64, 38, color, 0.34);
    effect.setDepth(35);

    this.tweens.add({
      targets: effect,
      alpha: 0,
      scaleX: 1.35,
      scaleY: 1.35,
      duration: 120,
      ease: 'Quad.easeOut',
      onComplete: () => {
        effect.destroy();
      },
    });
  }

  private showCounterEffect(x: number, y: number): void {
    const ring = this.add.circle(x, y, 28, 0xa7f3d0, 0.26);
    ring.setDepth(36);

    this.tweens.add({
      targets: ring,
      alpha: 0,
      scaleX: 1.8,
      scaleY: 1.8,
      duration: 180,
      ease: 'Quad.easeOut',
      onComplete: () => {
        ring.destroy();
      },
    });
  }

  private showExplosionEffect(x: number, y: number, radius: number, color: number): void {
    const flash = this.add.circle(x, y, Math.max(20, radius * 0.44), color, 0.42);
    const core = this.add.circle(x, y, Math.max(8, radius * 0.16), 0xfff1a8, 0.72);
    flash.setDepth(37);
    core.setDepth(38);

    this.tweens.add({
      targets: [flash, core],
      alpha: 0,
      scaleX: 2.1,
      scaleY: 2.1,
      duration: 220,
      ease: 'Quad.easeOut',
      onComplete: () => {
        flash.destroy();
        core.destroy();
      },
    });
  }

  private createSkillCooldownUi(): Array<{
    id: string;
    label: Phaser.GameObjects.Text;
    back: Phaser.GameObjects.Rectangle;
    fill: Phaser.GameObjects.Rectangle;
    value: Phaser.GameObjects.Text;
  }> {
    const cooldowns = this.player?.getSkillCooldowns() ?? [];
    const colors = [0x93c5fd, 0x86efac, 0xfca5a5];
    const rows = cooldowns.map((cooldown, index) => ({
      id: cooldown.id,
      label: cooldown.label,
      y: 96 + index * 22,
      color: colors[index] ?? 0xe2e8f0,
    }));

    return rows.map((row) => {
      const label = this.add.text(16, row.y - 8, row.label, {
        color: '#e2e8f0',
        fontFamily: 'monospace',
        fontSize: '13px',
      });
      const back = this.add.rectangle(122, row.y, 96, 10, 0x1f2933);
      const fill = this.add.rectangle(122, row.y, 96, 8, row.color);
      const value = this.add.text(176, row.y - 8, '', {
        color: '#cbd5e1',
        fontFamily: 'monospace',
        fontSize: '13px',
      });

      for (const item of [label, back, fill, value]) {
        item.setScrollFactor(0);
        item.setDepth(52);
      }
      fill.setDepth(53);
      back.setOrigin(0, 0.5);
      fill.setOrigin(0, 0.5);

      return {
        id: row.id,
        label,
        back,
        fill,
        value,
      };
    });
  }

  private updateSkillCooldownUi(): void {
    if (!this.player) {
      return;
    }

    const cooldowns = this.player.getSkillCooldowns();
    for (const row of this.skillCooldownUi) {
      const cooldown = cooldowns.find((entry) => entry.id === row.id);
      if (!cooldown) {
        continue;
      }

      const remainingMs = Math.max(0, cooldown.readyAt - this.time.now);
      const readyRatio = 1 - Phaser.Math.Clamp(remainingMs / cooldown.cooldownMs, 0, 1);
      row.fill.setSize(96 * readyRatio, 8);
      row.value.setText(remainingMs > 0 ? `${Math.ceil(remainingMs / 100) / 10}s` : 'Ready');
      row.value.setColor(remainingMs > 0 ? '#cbd5e1' : '#f8fafc');
    }
  }

  private showRestartButton(): void {
    if (this.restartText) {
      return;
    }

    this.restartText = this.createHudButton(480, 220, 'Restart');
    this.restartText.on('pointerdown', () => {
      this.restartStage();
    });
  }

  private showNextStageButton(): void {
    if (this.nextStageText || this.isGameOver) {
      return;
    }

    this.nextStageText = this.createHudButton(480, 220, 'Next Stage');
    this.nextStageText.on('pointerdown', () => {
      this.scene.restart({
        stageIndex: this.stageIndex + 1,
        runSeed: createRunSeed(),
        selectedClassId: this.selectedClass?.id,
      });
    });
  }

  private createHudButton(x: number, y: number, label: string): Phaser.GameObjects.Text {
    const button = this.add.text(x, y, label, {
      backgroundColor: '#d9e2ec',
      color: '#101820',
      fontFamily: 'DotGothic16, monospace',
      fontSize: '18px',
      padding: {
        x: 14,
        y: 10,
      },
    });

    button.setOrigin(0.5);
    button.setScrollFactor(0);
    button.setDepth(90);
    button.setInteractive({ useHandCursor: true });
    button.on('pointerover', () => {
      button.setStyle({ backgroundColor: '#fbbf24', color: '#101820' });
    });
    button.on('pointerout', () => {
      button.setStyle({ backgroundColor: '#d9e2ec', color: '#101820' });
    });

    return button;
  }

  private addTouchControls(): void {
    if (!this.inputSystem || !this.selectedClass) {
      return;
    }

    this.input.addPointer(8);
    const skills = this.selectedClass.skills;
    const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
    const coarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? false;
    const isTouchLayout = viewportWidth < 760 || this.sys.game.device.input.touch || coarsePointer;
    if (!isTouchLayout) {
      return;
    }
    const alpha = 0.76;
    this.createTouchButton('left', '<', 70, 462, 72, 62, 0x263447, undefined, alpha);
    this.createTouchButton('right', '>', 158, 462, 72, 62, 0x263447, undefined, alpha);
    this.createTouchButton('jump', 'JMP', 632, 462, 66, 56, 0x244c3a, undefined, alpha);
    this.createTouchButton('attack', 'ATK', 708, 462, 66, 56, 0x5b3b2d, undefined, alpha);
    this.createTouchButton('dash', 'DSH', 784, 462, 66, 56, 0x214b63, undefined, alpha);
    this.createTouchButton('skill1', 'S1', 676, 394, 64, 52, 0x3d355f, skills.skill1.name, alpha);
    this.createTouchButton('skill2', 'S2', 752, 394, 64, 52, 0x3c4a66, skills.skill2.name, alpha);
    this.createTouchButton('ultimate', 'ULT', 832, 394, 72, 52, 0x683a3a, skills.ultimate.name, alpha);
  }

  private createTouchButton(
    action: InputAction,
    label: string,
    x: number,
    y: number,
    width: number,
    height: number,
    color: number,
    tooltip?: string,
    alpha = 0.72,
  ): void {
    if (!this.inputSystem) {
      return;
    }

    const back = this.add.rectangle(x, y, width, height, color, alpha);
    const activePointers = new Set<number>();
    const text = this.add.text(x, y, label, {
      align: 'center',
      color: '#f8fafc',
      fontFamily: 'monospace',
      fontSize: label.length > 3 ? '12px' : '15px',
      fontStyle: 'bold',
    });

    back.setScrollFactor(0);
    text.setScrollFactor(0);
    back.setDepth(68);
    text.setDepth(69);
    text.setOrigin(0.5);
    back.setInteractive({ useHandCursor: true });

    const press = (pointer: Phaser.Input.Pointer): void => {
      if (activePointers.has(pointer.id)) {
        return;
      }

      activePointers.add(pointer.id);
      this.inputSystem?.press(action);
      back.setAlpha(0.96);
    };
    const release = (pointer: Phaser.Input.Pointer): void => {
      if (!activePointers.has(pointer.id)) {
        return;
      }

      activePointers.delete(pointer.id);
      this.inputSystem?.release(action);
      if (activePointers.size === 0) {
        back.setAlpha(alpha);
      }
    };

    back.on('pointerdown', press);
    back.on('pointerup', release);
    back.on('pointerout', release);
    back.on('pointerupoutside', release);

    if (!tooltip) {
      return;
    }

    const hint = this.add.text(x, y - height / 2 - 8, tooltip, {
      align: 'center',
      color: '#cbd5e1',
      fontFamily: 'monospace',
      fontSize: '10px',
      wordWrap: { width: 96 },
    });
    hint.setOrigin(0.5, 1);
    hint.setScrollFactor(0);
    hint.setDepth(69);
    hint.setAlpha(0);

    back.on('pointerover', () => hint.setAlpha(1));
    back.on('pointerout', () => hint.setAlpha(0));
  }

  private restartStage(): void {
    this.scene.restart({
      stageIndex: this.stageIndex,
      runSeed: this.runSeed,
      selectedClassId: this.selectedClass?.id,
    });
  }

  private rescueEnemyIfOutOfBounds(enemy: Enemy): void {
    if (!this.currentStage || enemy.getIsDead() || !enemy.active || enemy.y <= this.currentStage.worldHeight - 48) {
      return;
    }

    if (enemy.respawnFromFall()) {
      return;
    }

    enemy.defeatByFall();
  }

  private checkPlayerFallOut(): void {
    if (!this.currentStage || !this.player || this.isGameOver || this.player.getIsDead()) {
      return;
    }

    const fallLimitY = this.currentStage.worldHeight - 18;
    const cameraBottom = this.cameras.main.scrollY + this.cameras.main.height + 96;
    if (this.player.y < fallLimitY && this.player.y < cameraBottom) {
      return;
    }

    this.player.defeatByFall();
  }

  private findNearestSafePlatform(x: number): PlatformDefinition | undefined {
    return this.currentStage?.platforms
      .filter((platform) => platform.kind === 'ground' || platform.kind === 'ledge')
      .slice()
      .sort((left, right) => Math.abs(left.x - x) - Math.abs(right.x - x))[0];
  }
}
