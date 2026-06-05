import Phaser from 'phaser';
<<<<<<< HEAD
import { Player, PlayerAttackHitbox } from '../entities/Player';
import { Enemy, enemySpriteKeys } from '../entities/Enemy';
import { Boss } from '../entities/Boss';
import { Inventory } from '../systems/Inventory';
import { Items } from '../items/Item';
import { MetaProgression } from '../systems/MetaProgression';
import { ClassDefinition, classList, classMap } from '../classes';
import { getPurchasedSkills } from '../skills/SkillTree';
=======
import { ClassDefinition, getClassDefinition } from '../classes';
import { Player, PlayerAttackPayload } from '../entities/Player';
import { Slime } from '../entities/Slime';
import { InputAction, InputSystem } from '../systems/InputSystem';
>>>>>>> f2a20ba (Add class and input systems)
import {
  EnemySpawnDefinition,
  GeneratedStage,
  ItemSpawnDefinition,
  PlatformDefinition,
  TrapDefinition,
  TrapKind,
  createRunSeed,
  generateStage,
  readSeedFromLocation,
} from '../systems/StageGenerator';

const SAMURAI_SPRITE_URLS = {
  idle: new URL('../../assets/sprites/player/samurai/idle.png', import.meta.url).toString(),
  run: new URL('../../assets/sprites/player/samurai/run.png', import.meta.url).toString(),
  attack: new URL('../../assets/sprites/player/samurai/attack.png', import.meta.url).toString(),
  dash: new URL('../../assets/sprites/player/samurai/dash.png', import.meta.url).toString(),
};

type DamagePopupEvent = {
  damage: number;
  x: number;
  y: number;
};

type GameSceneData = {
  stageIndex?: number;
  runSeed?: string;
  selectedClassId?: ClassDefinition['id'];
};

export class GameScene extends Phaser.Scene {
  private player?: Player;
  private enemies?: Phaser.GameObjects.Group;
  private goalZone?: Phaser.GameObjects.Zone;
  private currentStage?: GeneratedStage;
  private hudBackground?: Phaser.GameObjects.Rectangle;
  private playerHpBarBack?: Phaser.GameObjects.Rectangle;
  private playerHpBarFill?: Phaser.GameObjects.Rectangle;
  private hpText?: Phaser.GameObjects.Text;
  private enemiesText?: Phaser.GameObjects.Text;
  private stageText?: Phaser.GameObjects.Text;
  private classText?: Phaser.GameObjects.Text;
  private seedText?: Phaser.GameObjects.Text;
<<<<<<< HEAD
  private metaText?: Phaser.GameObjects.Text;
  private goalDistanceText?: Phaser.GameObjects.Text;
  private inventoryCountText?: Phaser.GameObjects.Text;
  private playerSpecialBarBack?: Phaser.GameObjects.Rectangle;
  private playerSpecialBarFill?: Phaser.GameObjects.Rectangle;
  private gameStateBackground?: Phaser.GameObjects.Rectangle;
=======
  private skillCooldownUi: Array<{
    id: string;
    label: Phaser.GameObjects.Text;
    back: Phaser.GameObjects.Rectangle;
    fill: Phaser.GameObjects.Rectangle;
    value: Phaser.GameObjects.Text;
  }> = [];
>>>>>>> f2a20ba (Add class and input systems)
  private gameStateText?: Phaser.GameObjects.Text;
  private restartText?: Phaser.GameObjects.Text;
  private nextStageText?: Phaser.GameObjects.Text;
  private redFlash?: Phaser.GameObjects.Rectangle;
<<<<<<< HEAD
  private remainingEnemies = 0;
=======
  private inputSystem?: InputSystem;
  private selectedClass?: ClassDefinition;
  private remainingSlimes = 0;
>>>>>>> f2a20ba (Add class and input systems)
  private stageIndex = 1;
  private runSeed = '';
  private selectedClass?: ClassDefinition;
  private inventory?: Inventory;
  private isGameOver = false;
  private isStageClear = false;
  private restartKey?: Phaser.Input.Keyboard.Key;
  private inventoryKey?: Phaser.Input.Keyboard.Key;
  private shopKey?: Phaser.Input.Keyboard.Key;
  private skillKey?: Phaser.Input.Keyboard.Key;
  private specialKey?: Phaser.Input.Keyboard.Key;
  private activeTouchId?: number;

  constructor() {
    super('GameScene');
  }

  preload(): void {
<<<<<<< HEAD
    this.createParticleTextures();
    this.createPlaceholderPlayerTexture();
    this.createPlaceholderEnemyTexture();
    this.setupPlayerAnimationCreation();
    this.loadOptionalGameTextures();
  }

  private createParticleTextures(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);

    g.fillStyle(0xffffff);
    g.fillRect(0, 0, 4, 4);
    g.generateTexture('spark', 4, 4);
    g.clear();

    g.fillStyle(0xff9f43);
    g.fillRect(0, 0, 6, 6);
    g.generateTexture('ember', 6, 6);
    g.clear();

    g.fillStyle(0xcff3ff);
    g.fillRect(0, 0, 6, 6);
    g.generateTexture('ice', 6, 6);
    g.clear();

    g.fillStyle(0xff8a00);
    g.fillRect(0, 0, 6, 6);
    g.generateTexture('fire', 6, 6);
    g.destroy();
=======
    this.load.spritesheet('samurai-idle', SAMURAI_SPRITE_URLS.idle, { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('samurai-run', SAMURAI_SPRITE_URLS.run, { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('samurai-attack', SAMURAI_SPRITE_URLS.attack, { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('samurai-dash', SAMURAI_SPRITE_URLS.dash, { frameWidth: 32, frameHeight: 32 });
    this.createPlaceholderSlimeTexture();
>>>>>>> f2a20ba (Add class and input systems)
  }

  create(data?: GameSceneData): void {
    this.createPlayerAnimations();

    this.stageIndex = data?.stageIndex ?? 1;
    this.runSeed = data?.runSeed ?? readSeedFromLocation(window.location) ?? createRunSeed();
    this.selectedClass = classMap[data?.selectedClassId ?? 'samurai'];
    this.currentStage = generateStage(this.stageIndex, this.runSeed);
    this.isGameOver = false;
    this.isStageClear = false;

    const { worldWidth, worldHeight, start } = this.currentStage;

    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

    const platforms = this.createStageBlockout(this.currentStage.platforms);
    this.createGoal(this.currentStage);

<<<<<<< HEAD
    this.cursors = this.input.keyboard?.createCursorKeys();
    this.wasd = this.input.keyboard?.addKeys('A,D,J') as {
      A: Phaser.Input.Keyboard.Key;
      D: Phaser.Input.Keyboard.Key;
      J: Phaser.Input.Keyboard.Key;
    };
    this.inventoryKey = this.input.keyboard?.addKey('I');
    this.shopKey = this.input.keyboard?.addKey('M');
    this.skillKey = this.input.keyboard?.addKey('K');
=======
    this.inputSystem = new InputSystem(this);
    this.selectedClass = getClassDefinition('samurai');
>>>>>>> f2a20ba (Add class and input systems)
    this.restartKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.specialKey = this.input.keyboard?.addKey('U');

    if (!this.inputSystem || !this.selectedClass) {
      throw new Error('Player class input is required for the Phase1 prototype.');
    }

<<<<<<< HEAD
    this.player = new Player(
      this,
      start.x,
      start.y,
      {
        left: this.wasd.A,
        right: this.wasd.D,
        jump: this.cursors.space,
        dash: this.cursors.shift,
        attack: this.wasd.J,
      },
      this.selectedClass ?? classMap.samurai,
    );
=======
    this.player = new Player(this, start.x, start.y, this.inputSystem, this.selectedClass);
>>>>>>> f2a20ba (Add class and input systems)

    this.createStageTraps(this.currentStage.trapSpawns);
    this.applyPurchasedSkills();
    this.physics.add.collider(this.player, platforms);

    this.inventory = new Inventory();
    this.enemies = this.createEnemies(this.currentStage);
    this.physics.add.collider(this.enemies, platforms);
    this.physics.add.overlap(this.player, this.enemies, this.handlePlayerEnemyContact, undefined, this);

    if (!this.goalZone) {
      throw new Error('Stage goal is required.');
    }

    this.physics.add.overlap(this.player, this.goalZone, this.handleGoalReached, undefined, this);

    this.events.off('player-attack', this.handlePlayerAttack, this);
    this.events.off('player-counter', this.handlePlayerCounter, this);
    this.events.off('player-damaged', this.handlePlayerDamaged, this);
    this.events.off('enemy-damaged', this.handleEnemyDamaged, this);
    this.events.off('player-dead', this.handlePlayerDead, this);
    this.events.off('enemy-defeated', this.handleEnemyDefeated, this);
    this.game.events.off('item-drop', this.handleItemDrop, this);
    this.game.events.off('use-item', this.handleUseItem, this);
    this.game.events.off('skill-unlocked', this.handleSkillUnlocked, this);
    this.events.on('player-attack', this.handlePlayerAttack, this);
    this.events.on('player-counter', this.handlePlayerCounter, this);
    this.events.on('player-damaged', this.handlePlayerDamaged, this);
    this.events.on('enemy-damaged', this.handleEnemyDamaged, this);
    this.events.on('player-dead', this.handlePlayerDead, this);
    this.events.on('enemy-defeated', this.handleEnemyDefeated, this);
    this.game.events.on('item-drop', this.handleItemDrop, this);
    this.game.events.on('use-item', this.handleUseItem, this);
    this.game.events.on('skill-unlocked', this.handleSkillUnlocked, this);

    // 横スクロールアクションとして視界を安定させるため、プレイヤーを滑らかに追従する。
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setDeadzone(120, 80);

    this.addControlsText();
    this.addHud();
<<<<<<< HEAD
    this.createItemSpawns(this.currentStage.itemSpawns);
    this.createTouchControls();
    this.createMenuButtons();
=======
    this.addTouchControls();
>>>>>>> f2a20ba (Add class and input systems)
    this.updateHud();
  }

  update(time: number): void {
    if (this.isGameOver && this.restartKey && Phaser.Input.Keyboard.JustDown(this.restartKey)) {
      this.inputSystem?.endFrame();
      this.restartStage();
      return;
    }

    // Open UI scenes with shortcuts
    if (this.inventoryKey && Phaser.Input.Keyboard.JustDown(this.inventoryKey)) {
      this.scene.launch('InventoryScene', { inventory: this.inventory });
    }

    if (this.shopKey && Phaser.Input.Keyboard.JustDown(this.shopKey)) {
      this.scene.launch('MetaShopScene');
    }

    if (this.skillKey && Phaser.Input.Keyboard.JustDown(this.skillKey)) {
      this.scene.launch('SkillTreeScene', { selectedClassId: this.selectedClass?.id });
    }

    if (this.specialKey && Phaser.Input.Keyboard.JustDown(this.specialKey)) {
      this.player?.requestSpecial();
    }

    this.player?.update(time);

    if (this.player && this.enemies) {
      for (const enemy of this.enemies.getChildren()) {
        if (enemy instanceof Enemy) {
          enemy.update(this.player);
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

<<<<<<< HEAD
  private loadOptionalTexture(key: string, path: string): void {
    const image = new Image();
    image.onload = () => {
      if (!this.textures.exists(key)) {
        this.textures.addImage(key, image);
      }
    };
    image.onerror = () => {
      // missing optional image is fine; fallback textures remain.
    };
    image.src = path;
  }

  private loadOptionalSpriteSheet(key: string, path: string, frameWidth: number, frameHeight: number): void {
    const image = new Image();
    image.onload = () => {
      if (!this.textures.exists(key)) {
        this.textures.addSpriteSheet(key, image, { frameWidth, frameHeight });
      }
    };
    image.onerror = () => {
      // missing optional sprite sheet is fine; fallback textures remain.
    };
    image.src = path;
  }

  private loadOptionalGameTextures(): void {
    const textureKeys = new Set<string>([
      ...classList.flatMap((classDef) => [
        classDef.spriteKey,
        classDef.attackSpriteKey,
        classDef.projectileSpriteKey,
        classDef.specialSpriteKey,
      ]),
      ...enemySpriteKeys,
      'platform-ground',
      'platform-ledge',
      'platform-secret',
      'trap-fire',
      'trap-ice',
      'item-potion',
      'item-speedTonic',
      'item-strengthElixir',
      'item-minorArtifact',
      'item-rareArtifact',
    ].filter((key): key is string => Boolean(key)));

    for (const key of textureKeys) {
      this.loadOptionalTexture(key, `/assets/${key}.png`);
      this.loadOptionalTexture(key, `/assets/${key}.svg`);
    }

    const spriteSheetKeys = new Set<string>(
      classList
        .map((classDef) => classDef.spriteKey)
        .filter((key): key is string => Boolean(key)),
    );

    for (const key of spriteSheetKeys) {
      this.loadOptionalSpriteSheet(key, `/assets/${key}.png`, 48, 56);
    }
  }

  private setupPlayerAnimationCreation(): void {
    this.textures.on('addtexture', (key: string) => {
      if (classList.some((classDef) => classDef.spriteKey === key)) {
        this.createPlayerAnimations(key);
      }
    });
  }

  private createPlayerAnimations(textureKey: string): void {
    const animationIdleKey = `${textureKey}-idle`;
    const animationWalkKey = `${textureKey}-walk`;

    if (this.anims.exists(animationIdleKey) || this.anims.exists(animationWalkKey)) {
      return;
    }

    const texture = this.textures.get(textureKey);
    if (!texture) {
      return;
    }

    const frameNames = texture.getFrameNames().filter((name) => name !== '__BASE');
    if (frameNames.length === 0) {
=======
  private createPlayerAnimations(): void {
    if (this.anims.exists('samurai-idle')) {
>>>>>>> f2a20ba (Add class and input systems)
      return;
    }

    this.anims.create({
<<<<<<< HEAD
      key: animationIdleKey,
      frames: [{ key: textureKey, frame: frameNames[0] }],
      frameRate: 1,
      repeat: -1,
    });

    const walkIndices = frameNames.length >= 4 ? [1, 2, 3, 2] : [0, 1].slice(0, frameNames.length);
    const walkFrames = walkIndices.map((index) => ({
      key: textureKey,
      frame: frameNames[Math.min(index, frameNames.length - 1)],
    }));

    this.anims.create({
      key: animationWalkKey,
      frames: walkFrames,
      frameRate: 10,
      repeat: -1,
    });
=======
      key: 'samurai-idle',
      frames: this.anims.generateFrameNumbers('samurai-idle', { start: 0, end: 3 }),
      frameRate: 5,
      repeat: -1,
    });
    this.anims.create({
      key: 'samurai-run',
      frames: this.anims.generateFrameNumbers('samurai-run', { start: 0, end: 5 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: 'samurai-attack',
      frames: this.anims.generateFrameNumbers('samurai-attack', { start: 0, end: 5 }),
      frameRate: 18,
      repeat: 0,
    });
    this.anims.create({
      key: 'samurai-dash',
      frames: this.anims.generateFrameNumbers('samurai-dash', { start: 0, end: 3 }),
      frameRate: 16,
      repeat: -1,
    });
>>>>>>> f2a20ba (Add class and input systems)
  }

  private createStageBlockout(
    platformDefinitions: PlatformDefinition[],
  ): Phaser.Physics.Arcade.StaticGroup {
    const platforms = this.physics.add.staticGroup();

    const addPlatform = (definition: PlatformDefinition): void => {
      const textureKey = `platform-${definition.kind}`;
      if (this.textures.exists(textureKey)) {
        const platform = this.add.image(definition.x, definition.y, textureKey);
        platform.setDisplaySize(definition.width, definition.height);
        platforms.add(platform);
      } else {
        const platform = this.add.rectangle(
          definition.x,
          definition.y,
          definition.width,
          definition.height,
          definition.color,
        );
        platforms.add(platform);
      }
    };

    for (const definition of platformDefinitions) {
      addPlatform(definition);
    }

    // StaticGroup に手動追加した矩形の物理ボディを最終サイズへ同期する。
    platforms.refresh();

    return platforms;
  }

  private createStageTraps(traps: TrapDefinition[]): void {
    for (const trap of traps) {
      const trapKey = `trap-${trap.kind}`;
      const trapRect = this.textures.exists(trapKey)
        ? this.add.image(trap.x, trap.y, trapKey).setDisplaySize(trap.width, trap.height)
        : this.add.rectangle(trap.x, trap.y, trap.width, trap.height, trap.kind === 'fire' ? 0xff4d4d : 0x60a5fa, 0.64);
      trapRect.setDepth(16);
      this.physics.add.existing(trapRect, false);
      const body = trapRect.body as Phaser.Physics.Arcade.Body;
      body.setAllowGravity(false);
      body.setImmovable(true);
      trapRect.setData('kind', trap.kind);
      trapRect.setData('lastTrigger', 0);

      this.physics.add.overlap(this.player, trapRect, (_player, trapObject) => {
        const kind: TrapKind = trapObject.getData('kind');
        const last = trapObject.getData('lastTrigger') as number;
        const now = this.time.now;
        if (now < last + 500) {
          return;
        }
        trapObject.setData('lastTrigger', now);
        if (kind === 'fire') {
          this.player?.takeDamage(10, 0, -80, now);
        } else {
          this.player?.applySlow(0.5, 1200);
        }
      });

      this.physics.add.overlap(this.enemies, trapRect, (_enemy, trapObject) => {
        const kind: TrapKind = trapObject.getData('kind');
        const last = trapObject.getData('lastTrigger') as number;
        const now = this.time.now;
        if (now < last + 700) {
          return;
        }
        trapObject.setData('lastTrigger', now);
        const enemy = _enemy as Enemy;
        if (kind === 'fire') {
          enemy.takeDamage(8, 0, -50, now);
        } else {
          enemy.applySlow(0.7, 1000);
        }
      });
    }
  }

  private createEnemies(stage: GeneratedStage): Phaser.GameObjects.Group {
    const enemies = this.add.group();

    for (const spawn of stage.enemySpawns) {
      if (spawn.type === 'boss' || spawn.type === 'midboss' || spawn.type === 'finalBoss') {
        enemies.add(new Boss(this, spawn.x, spawn.y, spawn.type));
      } else {
        enemies.add(new Enemy(this, spawn.x, spawn.y, spawn.type));
      }
    }

    this.remainingEnemies = stage.enemySpawns.length;

    return enemies;
  }

  private createItemSpawns(itemSpawns: ItemSpawnDefinition[]): void {
    if (!this.player || !this.inventory || itemSpawns.length === 0) {
      return;
    }

    for (const spawn of itemSpawns) {
      const itemRect = this.add.rectangle(spawn.x, spawn.y, 34, 28, 0xfacc15);
      itemRect.setDepth(32);
      this.physics.add.existing(itemRect, false);

      const body = itemRect.body as Phaser.Physics.Arcade.Body;
      body.setAllowGravity(false);
      body.setImmovable(true);

      const item = Items[spawn.itemId];
      const iconKey = item?.iconKey ?? `item-${spawn.itemId}`;
      const icon = this.textures.exists(iconKey)
        ? this.add.image(spawn.x, spawn.y, iconKey).setDisplaySize(26, 26)
        : this.add.text(spawn.x, spawn.y - 2, '★', {
            color: '#101820',
            fontFamily: 'DotGothic16, monospace',
            fontSize: '18px',
          });
      icon.setOrigin(0.5);
      icon.setDepth(33);

      const pickup = () => {
        const item = Items[spawn.itemId];
        if (item) {
          this.inventory?.add(item);
          this.gameStateText?.setText(`Found ${item.name}!`);
          this.time.delayedCall(1400, () => {
            if (this.gameStateText && !this.isStageClear && !this.isGameOver) {
              this.gameStateText.setText('');
            }
          });
        }
        itemRect.destroy();
        icon.destroy();
      };

      this.physics.add.overlap(this.player, itemRect, pickup, undefined, this);
      itemRect.setInteractive({ useHandCursor: true });
      itemRect.on('pointerdown', pickup);
    }
  }

  private createGoal(stage: GeneratedStage): void {
    const post = this.add.rectangle(stage.goal.x, stage.goal.y, 16, 72, 0xd9e2ec);
    const flag = this.add.triangle(stage.goal.x + 28, stage.goal.y - 24, 0, 0, 54, 16, 0, 32, 0xfbbf24);
    post.setDepth(10);
    flag.setDepth(11);

    this.goalZone = this.add.zone(stage.goal.x, stage.goal.y, 86, 96);
    this.physics.add.existing(this.goalZone);

    const body = this.goalZone.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
  }

  private addControlsText(): void {
<<<<<<< HEAD
    const controlsBackground = this.add.rectangle(480, 32, 920, 34, 0x0b1118, 0.72);
    controlsBackground.setScrollFactor(0);
    controlsBackground.setDepth(45);

    const text = this.add.text(24, 20, 'A/D: Move  Space: Jump/Double Jump  Shift: Dash  J: Attack  R: Restart', {
      color: '#d9e2ec',
      fontFamily: 'DotGothic16, monospace',
      fontSize: '14px',
    });
=======
    const text = this.add.text(
      16,
      16,
      'A/D or Arrows: Move  Space/Up: Jump  Shift: Dash  J/Z: Skill1  Hold K/X: Skill2  L/C: Ultimate  R: Restart',
      {
        color: '#d9e2ec',
        fontFamily: 'monospace',
        fontSize: '14px',
      },
    );
>>>>>>> f2a20ba (Add class and input systems)

    text.setScrollFactor(0);
    text.setDepth(46);
  }

  private addHud(): void {
    this.hudBackground = this.add.rectangle(10, 40, 430, 148, 0x071623, 0.8);
    this.hudBackground.setOrigin(0, 0);
    this.hudBackground.setScrollFactor(0);
    this.hudBackground.setDepth(48);

    this.playerHpBarBack = this.add.rectangle(26, 76, 188, 18, 0x1f2933);
    this.playerHpBarBack.setOrigin(0, 0.5);
    this.playerHpBarBack.setScrollFactor(0);
    this.playerHpBarBack.setDepth(50);

    this.playerHpBarFill = this.add.rectangle(18, 46, 176, 10, 0x4ade80);
    this.playerHpBarFill.setOrigin(0, 0.5);
    this.playerHpBarFill.setScrollFactor(0);
    this.playerHpBarFill.setDepth(51);

    this.playerSpecialBarBack = this.add.rectangle(18, 64, 176, 10, 0x1f2933);
    this.playerSpecialBarBack.setOrigin(0, 0.5);
    this.playerSpecialBarBack.setScrollFactor(0);
    this.playerSpecialBarBack.setDepth(51);

    this.playerSpecialBarFill = this.add.rectangle(18, 64, 0, 10, 0xf59e0b);
    this.playerSpecialBarFill.setOrigin(0, 0.5);
    this.playerSpecialBarFill.setScrollFactor(0);
    this.playerSpecialBarFill.setDepth(52);

    this.hpText = this.add.text(204, 37, '', {
      color: '#f8fafc',
      fontFamily: 'DotGothic16, monospace',
      fontSize: '14px',
    });
    this.hpText.setScrollFactor(0);
    this.hpText.setDepth(52);

    this.enemiesText = this.add.text(16, 64, '', {
      color: '#f8fafc',
      fontFamily: 'DotGothic16, monospace',
      fontSize: '16px',
    });
    this.enemiesText.setScrollFactor(0);
    this.enemiesText.setDepth(52);

    this.stageText = this.add.text(16, 86, '', {
      color: '#cbd5e1',
      fontFamily: 'DotGothic16, monospace',
      fontSize: '14px',
    });
    this.stageText.setScrollFactor(0);
    this.stageText.setDepth(52);

    this.classText = this.add.text(16, 106, '', {
      color: '#94a3b8',
      fontFamily: 'DotGothic16, monospace',
      fontSize: '14px',
    });
    this.classText.setScrollFactor(0);
    this.classText.setDepth(52);

    this.seedText = this.add.text(16, 126, '', {
      color: '#94a3b8',
      fontFamily: 'DotGothic16, monospace',
      fontSize: '13px',
    });
    this.seedText.setScrollFactor(0);
    this.seedText.setDepth(52);

<<<<<<< HEAD
    this.metaText = this.add.text(26, 146, '', {
      color: '#ffd166',
      fontFamily: 'DotGothic16, monospace',
      fontSize: '13px',
    });
    this.metaText.setScrollFactor(0);
    this.metaText.setDepth(52);

    this.goalDistanceText = this.add.text(240, 146, '', {
      color: '#94a3b8',
      fontFamily: 'DotGothic16, monospace',
      fontSize: '13px',
    });
    this.goalDistanceText.setScrollFactor(0);
    this.goalDistanceText.setDepth(52);

    this.inventoryCountText = this.add.text(26, 106, '', {
      color: '#cbd5e1',
      fontFamily: 'DotGothic16, monospace',
      fontSize: '13px',
    });
    this.inventoryCountText.setScrollFactor(0);
    this.inventoryCountText.setDepth(52);

    this.gameStateBackground = this.add.rectangle(480, 160, 560, 84, 0x071623, 0.72);
    this.gameStateBackground.setScrollFactor(0);
    this.gameStateBackground.setDepth(79);
=======
    this.skillCooldownUi = this.createSkillCooldownUi();
>>>>>>> f2a20ba (Add class and input systems)

    this.gameStateText = this.add.text(480, 160, '', {
      align: 'center',
      color: '#f8fafc',
      fontFamily: 'DotGothic16, monospace',
      fontSize: '32px',
      stroke: '#071623',
      strokeThickness: 5,
    });
    this.gameStateText.setOrigin(0.5);
    this.gameStateText.setScrollFactor(0);
    this.gameStateText.setDepth(80);

    this.redFlash = this.add.rectangle(480, 270, 960, 540, 0xff1f1f, 0);
    this.redFlash.setScrollFactor(0);
    this.redFlash.setDepth(70);
  }

  private updateHud(): void {
    if (!this.player || !this.hpText || !this.enemiesText || !this.stageText || !this.seedText || !this.playerHpBarFill || !this.goalDistanceText || !this.inventoryCountText) {
      return;
    }

    const hpRatio = Phaser.Math.Clamp(this.player.getHp() / this.player.getMaxHp(), 0, 1);
    this.playerHpBarFill.setSize(176 * hpRatio, 10);
    this.playerHpBarFill.setFillStyle(hpRatio <= 0.35 ? 0xfb7185 : 0x4ade80);
    this.playerSpecialBarFill?.setSize(176 * this.player.getSpecialChargeRatio(), 10);
    this.hpText.setText(`HP: ${this.player.getHp()} / ${this.player.getMaxHp()}`);
    this.enemiesText.setText(`Enemies: ${this.remainingEnemies}`);
    this.stageText.setText(`Stage: ${this.stageIndex}`);
    this.classText?.setText(`Class: ${this.selectedClass?.name ?? '侍'}`);
    this.seedText.setText(`Seed: ${this.runSeed}`);
<<<<<<< HEAD
    this.metaText?.setText(`Meta: ${MetaProgression.getPoints()}`);

    if (this.currentStage) {
      const remainingPx = Math.max(0, Math.floor(this.currentStage.goal.x - this.player.x));
      this.goalDistanceText?.setText(`Goal: ${remainingPx} px`);
    }

    this.inventoryCountText?.setText(`Inventory: ${this.inventory?.getAll().length ?? 0} slots`);
  }

  private createMenuButtons(): void {
    this.add.rectangle(760, 24, 320, 180, 0x071623, 0.8).setOrigin(0.5, 0).setScrollFactor(0).setDepth(48);

    const inventoryButton = this.createHudButton(850, 44, 'Inventory (I)');
    inventoryButton.on('pointerdown', () => this.scene.launch('InventoryScene', { inventory: this.inventory }));

    const shopButton = this.createHudButton(850, 94, 'Meta Shop (M)');
    shopButton.on('pointerdown', () => this.scene.launch('MetaShopScene'));

    const skillButton = this.createHudButton(850, 144, 'Skill Tree (K)');
    skillButton.on('pointerdown', () => this.scene.launch('SkillTreeScene', { selectedClassId: this.selectedClass?.id }));
  }

  private createTouchControls(): void {
    const createTouchButton = (x: number, y: number, label: string): Phaser.GameObjects.Text => {
      const button = this.add.text(x, y, label, {
        backgroundColor: '#1f2933',
        color: '#f8fafc',
        fontFamily: 'DotGothic16, monospace',
        fontSize: '16px',
        padding: { x: 12, y: 10 },
      });
      button.setOrigin(0.5);
      button.setScrollFactor(0);
      button.setDepth(60);
      button.setInteractive({ useHandCursor: true });
      return button;
    };

    const movePad = this.add.rectangle(100, 400, 220, 220, 0x1f2933, 0.32);
    movePad.setOrigin(0, 0);
    movePad.setScrollFactor(0);
    movePad.setDepth(55);
    movePad.setInteractive();

    const padLabel = this.add.text(210, 520, 'Slide to move', {
      color: '#f8fafc',
      fontFamily: 'DotGothic16, monospace',
      fontSize: '14px',
    });
    padLabel.setOrigin(0.5);
    padLabel.setScrollFactor(0);
    padLabel.setDepth(60);

    const updateTouchDirection = (pointer: Phaser.Input.Pointer): void => {
      const padBounds = movePad.getBounds();
      if (pointer.x < padBounds.left || pointer.x > padBounds.right || pointer.y < padBounds.top || pointer.y > padBounds.bottom) {
        this.player?.setTouchHold('left', false);
        this.player?.setTouchHold('right', false);
        return;
      }

      const midX = padBounds.left + padBounds.width / 2;
      const leftHold = pointer.x < midX - 16;
      const rightHold = pointer.x > midX + 16;
      this.player?.setTouchHold('left', leftHold);
      this.player?.setTouchHold('right', rightHold);
    };

    movePad.on('pointerdown', (pointer) => {
      this.activeTouchId = pointer.id;
      updateTouchDirection(pointer);
    });

    movePad.on('pointermove', (pointer) => {
      if (this.activeTouchId !== pointer.id || !pointer.isDown) {
        return;
      }
      updateTouchDirection(pointer);
    });

    movePad.on('pointerup', (pointer) => {
      if (this.activeTouchId !== pointer.id) {
        return;
      }
      this.activeTouchId = undefined;
      this.player?.setTouchHold('left', false);
      this.player?.setTouchHold('right', false);
    });

    movePad.on('pointerupoutside', () => {
      this.activeTouchId = undefined;
      this.player?.setTouchHold('left', false);
      this.player?.setTouchHold('right', false);
    });

    const jumpButton = createTouchButton(760, 430, 'Jump');
    jumpButton.on('pointerdown', () => this.player?.requestTouchAction('jump'));

    const dashButton = createTouchButton(860, 430, 'Dash');
    dashButton.on('pointerdown', () => this.player?.requestTouchAction('dash'));

    const attackButton = createTouchButton(810, 510, 'Attack');
    attackButton.on('pointerdown', () => this.player?.requestTouchAction('attack'));
    const specialButton = createTouchButton(760, 510, 'Special');
    specialButton.on('pointerdown', () => this.player?.requestSpecial());
  }

  private handlePlayerAttack(hitbox: PlayerAttackHitbox): void {
    if (!this.player || !this.enemies) {
      hitbox.destroy();
=======
    this.updateSkillCooldownUi();
  }

  private handlePlayerAttack(payload: PlayerAttackPayload): void {
    if (!this.slimes || !this.player) {
      payload.hitbox.destroy();
>>>>>>> f2a20ba (Add class and input systems)
      return;
    }

    this.resolvePlayerAttack(payload);
  }

  private handlePlayerCounter(payload: PlayerAttackPayload): void {
    this.resolvePlayerAttack(payload);
    this.showCounterEffect(payload.hitbox.x, payload.hitbox.y);
  }

  private resolvePlayerAttack(payload: PlayerAttackPayload): void {
    if (!this.slimes || !this.player) {
      payload.hitbox.destroy();
      return;
    }

    this.showAttackEffect(payload.hitbox.x, payload.hitbox.y, payload.effectColor);

<<<<<<< HEAD
    const hitEnemies = new Set<Enemy>();
    const overlap = this.physics.add.overlap(hitbox, this.enemies, (_attack, target) => {
      if (!(target instanceof Enemy) || !this.player || hitEnemies.has(target)) {
=======
    const hitSlimes = new Set<Slime>();
    const overlap = this.physics.add.overlap(payload.hitbox, this.slimes, (_attack, target) => {
      if (!(target instanceof Slime) || !this.player || hitSlimes.has(target)) {
>>>>>>> f2a20ba (Add class and input systems)
        return;
      }

      const direction = Math.sign(target.x - this.player.x) || this.player.getFacing();
<<<<<<< HEAD

      const classId = this.selectedClass?.id ?? 'samurai';

      switch (classId) {
        case 'pyromancer': {
          // FireBolt: explode on hit
          const baseDmg = this.player.getAttackPower();
          // create small explosion
          const ex = this.add.circle(target.x, target.y, 48, 0xffb27a, 0.34);
          ex.setDepth(42);
          this.tweens.add({ targets: ex, alpha: 0, scale: 1.2, duration: 220, onComplete: () => ex.destroy() });
          for (const e of this.enemies.getChildren()) {
            if (e instanceof Enemy) {
              const dist = Phaser.Math.Distance.Between(e.x, e.y, target.x, target.y);
              if (dist <= 48) {
                e.takeDamage(baseDmg, Math.sign(e.x - this.player.x) * 200, -120, this.time.now);
              }
            }
          }
          hitEnemies.add(target);
          break;
        }
        case 'frostlancer': {
          // IceLance: pierce and slow
          const baseDmg = this.player.getAttackPower();
          target.takeDamage(baseDmg, direction * 160, -80, this.time.now);
          target.applySlow(0.6, 2000);
          break;
        }
        case 'beast': {
          // RendClaw: apply bleed on hit
          const baseDmg = Math.floor(this.player.getAttackPower());
          target.takeDamage(baseDmg, direction * 220, -120, this.time.now);
          target.applyBleed(Math.floor(this.player.getAttackPower() * 0.8), 3000);
          hitEnemies.add(target);
          break;
        }
        case 'dragonblood': {
          // heavy hit with extra knockback
          const baseDmg = Math.floor(this.player.getAttackPower() * 1.2);
          target.takeDamage(baseDmg, direction * 420, -200, this.time.now);
          hitEnemies.add(target);
          break;
        }
        case 'winddancer': {
          // quick double-hit: schedule second small hit
          const baseDmg = Math.floor(this.player.getAttackPower());
          target.takeDamage(baseDmg, direction * 180, -100, this.time.now);
          hitEnemies.add(target);
          this.time.delayedCall(120, () => {
            if (!target.getIsDead()) target.takeDamage(Math.max(1, Math.floor(baseDmg * 0.6)), direction * 120, -60, this.time.now);
          });
          break;
        }
        case 'machinist': {
          // regular bullet behavior: damage once
          const baseDmg = Math.floor(this.player.getAttackPower());
          target.takeDamage(baseDmg, direction * 200, -100, this.time.now);
          hitEnemies.add(target);
          break;
        }
        default: {
          hitEnemies.add(target);
          target.takeDamage(this.player.getAttackPower(), direction * 260, -160, this.time.now);
          break;
        }
      }

      this.player.addSpecialCharge(12);
=======
      hitSlimes.add(target);
      target.takeDamage(payload.damage, direction * payload.knockbackX, payload.knockbackY, this.time.now);
>>>>>>> f2a20ba (Add class and input systems)
    });

    this.time.delayedCall(payload.durationMs, () => {
      overlap.destroy();
      payload.hitbox.destroy();
    });
  }

  private handlePlayerSpecial(payload: { classId: string; x: number; y: number; facing: -1 | 1; time: number }): void {
    if (!this.player || !this.enemies) return;

    const classId = payload.classId;
    switch (classId) {
      case 'beast': {
        // Frenzy: short attack/speed buff
        this.player.addTempAttackBonus(8, 3000);
        this.player.addTempSpeedBonus(72, 3000);
        const aura = this.add.ellipse(this.player.x, this.player.y, 120, 80, 0xffb4a2, 0.22);
        aura.setDepth(40);
        aura.setScrollFactor(0);
        this.tweens.add({ targets: aura, alpha: 0, duration: 3000, onComplete: () => aura.destroy() });
        break;
      }
      case 'pyromancer': {
        // Flame shield: damages enemies on touch for 3s
        const shield = this.add.circle(this.player.x, this.player.y, 48, 0xff8a00, 0.26);
        shield.setDepth(40);
        this.physics.add.existing(shield);
        const body = shield.body as Phaser.Physics.Arcade.Body;
        body.setAllowGravity(false);
        body.setImmovable(true);

        // fire particles
        const fireP = this.add.particles('fire');
        const fe = fireP.createEmitter({ x: this.player.x, y: this.player.y, speed: { min: 10, max: 60 }, lifespan: 600, quantity: 2, scale: { start: 0.9, end: 0 }, blendMode: 'ADD' });
        fe.startFollow(shield);

        const overlap = this.physics.add.overlap(shield, this.enemies, (_s, target) => {
          if (target instanceof Enemy) {
            target.takeDamage(this.player!.getAttackPower(), 0, -80, this.time.now);
          }
        });

        this.time.delayedCall(3000, () => {
          overlap.destroy();
          shield.destroy();
          fireP.destroy();
        });
        break;
      }
      case 'frostlancer': {
        // Ice lance projectile
        const proj = this.add.rectangle(this.player.x + payload.facing * 44, this.player.y - 4, 18, 6, 0xcff3ff);
        this.physics.add.existing(proj);
        const body = proj.body as Phaser.Physics.Arcade.Body;
        body.setAllowGravity(false);
        body.setImmovable(true);
        body.setVelocityX(payload.facing * 520);

        // ice trail
        const iceP = this.add.particles('ice');
        const ie = iceP.createEmitter({ x: proj.x, y: proj.y, speed: { min: 10, max: 40 }, lifespan: 420, quantity: 1, scale: { start: 0.9, end: 0 }, blendMode: 'ADD' });
        ie.startFollow(proj);

        this.physics.add.overlap(proj, this.enemies, (_p, target) => {
          if (target instanceof Enemy) {
            target.takeDamage(this.player!.getAttackPower(), payload.facing * 160, -80, this.time.now);
            target.applySlow(0.6, 2000);
          }
        });

        this.time.delayedCall(1400, () => {
          if (proj && proj.destroy) proj.destroy();
          iceP.destroy();
        });
        break;
      }
      case 'dragonblood': {
        // Dragonblood Release: temp attack buff + shockwave
        const bonus = Math.max(6, Math.floor(this.player.getAttackPower() * 0.3));
        this.player.addTempAttackBonus(bonus, 8000);

        const shock = this.add.ellipse(this.player.x + payload.facing * 48, this.player.y, 160, 96, 0xffb27a, 0.28);
        shock.setDepth(40);
        this.physics.add.existing(shock);

        // ember particles
        const emberP = this.add.particles('ember');
        const ee = emberP.createEmitter({ x: shock.x, y: shock.y, speed: { min: 40, max: 160 }, lifespan: 420, quantity: 8, scale: { start: 1.0, end: 0 }, blendMode: 'ADD' });
        this.time.delayedCall(260, () => {
          ee.stop();
          emberP.destroy();
        });

        const overlap = this.physics.add.overlap(shock, this.enemies, (_s, target) => {
          if (target instanceof Enemy) {
            target.takeDamage(this.player!.getAttackPower() + bonus, payload.facing * 280, -140, this.time.now);
          }
        });
        this.time.delayedCall(260, () => {
          overlap.destroy();
          shock.destroy();
        });
        break;
      }
      case 'winddancer': {
        // Gale Step: short invulnerable dash
        if (this.player) {
          this.player.setVelocity(payload.facing * 620, 0);
          this.player.setTint(0x9be7ff);
          // wind trail
          const windP = this.add.particles('spark');
          const we = windP.createEmitter({ x: this.player.x, y: this.player.y, speed: { min: 40, max: 140 }, angle: { min: -20, max: 20 }, lifespan: 360, quantity: 3, scale: { start: 0.8, end: 0 }, blendMode: 'ADD' });
          we.startFollow(this.player);
          this.time.delayedCall(260, () => {
            windP.destroy();
            if (this.player && !this.player.getIsDead()) this.player.clearTint();
          });
        }
        break;
      }
      case 'machinist': {
        // Turret: place turret that shoots for 6s
        const turret = this.add.rectangle(this.player.x + payload.facing * 48, this.player.y - 8, 18, 18, 0xd1d5db);
        this.physics.add.existing(turret);
        const body = turret.body as Phaser.Physics.Arcade.Body;
        body.setAllowGravity(false);
        body.setImmovable(true);

        const shootEvent = this.time.addEvent({
          delay: 420,
          callback: () => {
            const dir = payload.facing;
            const bullet = this.add.rectangle(turret.x + dir * 16, turret.y, 12, 6, 0xffffff);
            this.physics.add.existing(bullet);
            const bbody = bullet.body as Phaser.Physics.Arcade.Body;
            bbody.setAllowGravity(false);
            bbody.setImmovable(true);
            bbody.setVelocityX(dir * 360);

            // bullet spark
            const bp = this.add.particles('spark');
            const be = bp.createEmitter({ x: bullet.x, y: bullet.y, speed: { min: 10, max: 80 }, lifespan: 240, quantity: 1, scale: { start: 0.7, end: 0 }, blendMode: 'ADD' });
            be.startFollow(bullet);

            this.physics.add.overlap(bullet, this.enemies, (_b, target) => {
              if (target instanceof Enemy) {
                target.takeDamage(this.player!.getAttackPower() - 4, dir * 160, -80, this.time.now);
                bullet.destroy();
                bp.destroy();
              }
            });
            this.time.delayedCall(1600, () => {
              if (bullet && bullet.destroy) bullet.destroy();
              if (bp && bp.destroy) bp.destroy();
            });
          },
          loop: true,
        });

        this.time.delayedCall(6000, () => {
          shootEvent.remove(false);
          turret.destroy();
        });
        break;
      }
      default:
        break;
    }
  }

  private handleUseItem(payload: { itemId: string; index?: number }): void {
    if (!this.player || !this.inventory) {
      return;
    }

    this.player.applyItem(payload.itemId);
  }

  private handleSkillUnlocked(payload: { skillId: string }): void {
    if (!this.player) {
      return;
    }

    this.player.applySkill(payload.skillId);
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
    // award base meta point on enemy defeat
    MetaProgression.addPoints(1);
  }

  private handleItemDrop(payload: { x: number; y: number; itemId: string }): void {
    const rect = this.add.rectangle(payload.x, payload.y, 18, 18, 0xfccf6b);
    rect.setInteractive({ useHandCursor: true });
    rect.setDepth(60);
    rect.on('pointerdown', () => {
      const item = Items[payload.itemId];
      if (item && this.inventory) {
        this.inventory.add(item);
      }
      rect.destroy();
    });
    this.time.delayedCall(8000, () => {
      if (rect && rect.destroy) rect.destroy();
    });
  }

  private handleGoalReached(): void {
    if (this.isGameOver || this.isStageClear || this.remainingEnemies > 0) {
      return;
    }

    this.isStageClear = true;

    if (this.gameStateText) {
      this.gameStateText.setText('Stage Clear');
    }

    this.showNextStageButton();
  }

  private handlePlayerDead(): void {
    this.isGameOver = true;

    if (this.gameStateText) {
      this.gameStateText.setText('Game Over');
    }

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

    // small particle burst
    const particles = this.add.particles('spark');
    const emitter = particles.createEmitter({
      x,
      y,
      speed: { min: 40, max: 120 },
      angle: { min: 0, max: 360 },
      lifespan: 320,
      quantity: 6,
      scale: { start: 1.0, end: 0 },
      blendMode: 'ADD',
    });

    this.time.delayedCall(260, () => {
      particles.destroy();
    });

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
      y: 132 + index * 22,
      color: colors[index] ?? 0xe2e8f0,
    }));

    return rows.map((row) => {
      const label = this.add.text(16, row.y - 8, row.label, {
        color: '#e2e8f0',
        fontFamily: 'monospace',
        fontSize: '13px',
      });
      const back = this.add.rectangle(82, row.y, 96, 10, 0x1f2933);
      const fill = this.add.rectangle(82, row.y, 96, 8, row.color);
      const value = this.add.text(136, row.y - 8, '', {
        color: '#cbd5e1',
        fontFamily: 'monospace',
        fontSize: '13px',
      });

      label.setScrollFactor(0);
      back.setScrollFactor(0);
      fill.setScrollFactor(0);
      value.setScrollFactor(0);
      label.setDepth(52);
      back.setDepth(52);
      fill.setDepth(53);
      value.setDepth(52);
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
        runSeed: this.runSeed,
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

<<<<<<< HEAD
  private applyPurchasedSkills(): void {
    if (!this.player || !this.selectedClass) {
      return;
    }

    const purchased = getPurchasedSkills(this.selectedClass.id);
    purchased.forEach((skillId) => {
      this.player?.applySkill(skillId);
    });
=======
  private addTouchControls(): void {
    if (!this.inputSystem || !this.selectedClass) {
      return;
    }

    const skills = this.selectedClass.skills;

    this.createTouchButton('left', '<', 58, 464, 60, 56, 0x263447);
    this.createTouchButton('right', '>', 132, 464, 60, 56, 0x263447);
    this.createTouchButton('jump', 'JMP', 820, 464, 72, 56, 0x244c3a);
    this.createTouchButton('dash', 'DASH', 900, 464, 72, 56, 0x214b63);
    this.createTouchButton('skill1', 'S1', 642, 472, 58, 48, 0x3d355f, skills.skill1.name);
    this.createTouchButton('skill2', 'S2', 708, 472, 58, 48, 0x3c4a66, skills.skill2.name);
    this.createTouchButton('ultimate', 'ULT', 774, 472, 58, 48, 0x683a3a, skills.ultimate.name);
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
  ): void {
    if (!this.inputSystem) {
      return;
    }

    const back = this.add.rectangle(x, y, width, height, color, 0.72);
    const text = this.add.text(x, y, label, {
      align: 'center',
      color: '#f8fafc',
      fontFamily: 'monospace',
      fontSize: label.length > 3 ? '12px' : '14px',
      fontStyle: 'bold',
    });

    back.setScrollFactor(0);
    text.setScrollFactor(0);
    back.setDepth(68);
    text.setDepth(69);
    text.setOrigin(0.5);
    back.setInteractive({ useHandCursor: true });

    const press = (): void => {
      this.inputSystem?.press(action);
      back.setAlpha(0.96);
    };
    const release = (): void => {
      this.inputSystem?.release(action);
      back.setAlpha(0.72);
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
>>>>>>> f2a20ba (Add class and input systems)
  }

  private restartStage(): void {
    this.scene.restart({
      stageIndex: this.stageIndex,
      runSeed: this.runSeed,
      selectedClassId: this.selectedClass?.id,
    });
  }
}
