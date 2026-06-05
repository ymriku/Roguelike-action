import Phaser from 'phaser';
import { ClassDefinition, DEFAULT_CLASS_ID, PlayerClassId, getClassDefinition } from '../classes';
import { Enemy } from '../entities/Enemy';
import { Player, PlayerAttackPayload } from '../entities/Player';
import { InputAction, InputSystem } from '../systems/InputSystem';
import {
  GeneratedStage,
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
    this.load.spritesheet('samurai-idle', SAMURAI_SPRITE_URLS.idle, { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('samurai-run', SAMURAI_SPRITE_URLS.run, { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('samurai-attack', SAMURAI_SPRITE_URLS.attack, { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('samurai-dash', SAMURAI_SPRITE_URLS.dash, { frameWidth: 32, frameHeight: 32 });
    this.createPlaceholderEnemyTexture();
  }

  create(data?: GameSceneData): void {
    this.createPlayerAnimations();

    this.stageIndex = data?.stageIndex ?? 1;
    this.runSeed = data?.runSeed ?? readSeedFromLocation(window.location) ?? createRunSeed();
    this.selectedClass = getClassDefinition(data?.selectedClassId ?? DEFAULT_CLASS_ID);
    this.currentStage = generateStage(this.stageIndex, this.runSeed);
    this.inputSystem = new InputSystem(this);
    this.isGameOver = false;
    this.isStageClear = false;
    this.skillCooldownUi = [];

    const { worldWidth, worldHeight, start } = this.currentStage;
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

    const platforms = this.createStageBlockout(this.currentStage.platforms);
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
    this.events.off('player-counter', this.handlePlayerCounter, this);
    this.events.off('player-damaged', this.handlePlayerDamaged, this);
    this.events.off('enemy-damaged', this.handleEnemyDamaged, this);
    this.events.off('player-dead', this.handlePlayerDead, this);
    this.events.off('enemy-defeated', this.handleEnemyDefeated, this);
    this.events.on('player-attack', this.handlePlayerAttack, this);
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

  private createPlayerAnimations(): void {
    if (this.anims.exists('samurai-idle')) {
      return;
    }

    this.anims.create({
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
  }

  private createStageBlockout(platformDefinitions: PlatformDefinition[]): Phaser.Physics.Arcade.StaticGroup {
    const platforms = this.physics.add.staticGroup();

    for (const definition of platformDefinitions) {
      const platform = this.add.rectangle(
        definition.x,
        definition.y,
        definition.width,
        definition.height,
        definition.color,
      );
      platforms.add(platform);
    }

    platforms.refresh();
    return platforms;
  }

  private createStageTraps(traps: TrapDefinition[]): void {
    if (!this.player || !this.enemies) {
      return;
    }

    for (const trap of traps) {
      const trapRect = this.add.rectangle(
        trap.x,
        trap.y,
        trap.width,
        trap.height,
        trap.kind === 'fire' ? 0xff4d4d : 0x60a5fa,
        0.64,
      );
      trapRect.setDepth(16);
      this.physics.add.existing(trapRect, false);
      const body = trapRect.body as Phaser.Physics.Arcade.Body;
      body.setAllowGravity(false);
      body.setImmovable(true);
      trapRect.setData('kind', trap.kind);
      trapRect.setData('lastTrigger', 0);

      this.physics.add.overlap(this.player, trapRect, (_playerObject, trapObject) => {
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

      this.physics.add.overlap(this.enemies, trapRect, (enemyObject, trapObject) => {
        if (!(enemyObject instanceof Enemy)) {
          return;
        }
        const trapGameObject = trapObject as Phaser.GameObjects.GameObject;
        const kind = trapGameObject.getData('kind') as TrapKind;
        const last = trapGameObject.getData('lastTrigger') as number;
        const now = this.time.now;
        if (now < last + 700) {
          return;
        }
        trapGameObject.setData('lastTrigger', now);
        if (kind === 'fire') {
          enemyObject.takeDamage(8, 0, -50, now);
        } else {
          enemyObject.applySlow(0.7, 1000);
        }
      });
    }
  }

  private createEnemies(stage: GeneratedStage): Phaser.GameObjects.Group {
    const enemies = this.add.group();

    for (const spawn of stage.enemySpawns) {
      enemies.add(new Enemy(this, spawn.x, spawn.y, spawn.type));
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
    const text = this.add.text(16, 512, 'A/D or Arrow: Move  Space/Up: Jump  Shift: Dash  J/K/L: Skills', {
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
    const overlap = this.physics.add.overlap(payload.hitbox, this.enemies, (_hitbox, target) => {
      if (!(target instanceof Enemy) || hitEnemies.has(target)) {
        return;
      }

      hitEnemies.add(target);
      const direction = this.player?.getFacing() ?? 1;
      target.takeDamage(payload.damage, direction * payload.knockbackX, payload.knockbackY, this.time.now);
      this.showAttackEffect(target.x, target.y, payload.effectColor);
    });

    this.time.delayedCall(payload.durationMs, () => {
      overlap.destroy();
      payload.hitbox.destroy();
    });
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
  }

  private restartStage(): void {
    this.scene.restart({
      stageIndex: this.stageIndex,
      runSeed: this.runSeed,
      selectedClassId: this.selectedClass?.id,
    });
  }
}
