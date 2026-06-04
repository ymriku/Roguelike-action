import Phaser from 'phaser';
import { Player, PlayerAttackHitbox } from '../entities/Player';
import { Slime } from '../entities/Slime';
import {
  GeneratedStage,
  PlatformDefinition,
  createRunSeed,
  generateStage,
  readSeedFromLocation,
} from '../systems/StageGenerator';

type DamagePopupEvent = {
  damage: number;
  x: number;
  y: number;
};

type GameSceneData = {
  stageIndex?: number;
  runSeed?: string;
};

export class GameScene extends Phaser.Scene {
  private player?: Player;
  private slimes?: Phaser.GameObjects.Group;
  private goalZone?: Phaser.GameObjects.Zone;
  private currentStage?: GeneratedStage;
  private playerHpBarBack?: Phaser.GameObjects.Rectangle;
  private playerHpBarFill?: Phaser.GameObjects.Rectangle;
  private hpText?: Phaser.GameObjects.Text;
  private enemiesText?: Phaser.GameObjects.Text;
  private stageText?: Phaser.GameObjects.Text;
  private seedText?: Phaser.GameObjects.Text;
  private gameStateText?: Phaser.GameObjects.Text;
  private restartText?: Phaser.GameObjects.Text;
  private nextStageText?: Phaser.GameObjects.Text;
  private redFlash?: Phaser.GameObjects.Rectangle;
  private remainingSlimes = 0;
  private stageIndex = 1;
  private runSeed = '';
  private isGameOver = false;
  private isStageClear = false;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: {
    A: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
    J: Phaser.Input.Keyboard.Key;
  };
  private restartKey?: Phaser.Input.Keyboard.Key;

  constructor() {
    super('GameScene');
  }

  preload(): void {
    this.createPlaceholderPlayerTexture();
    this.createPlaceholderSlimeTexture();
  }

  create(data?: GameSceneData): void {
    this.stageIndex = data?.stageIndex ?? 1;
    this.runSeed = data?.runSeed ?? readSeedFromLocation(window.location) ?? createRunSeed();
    this.currentStage = generateStage(this.stageIndex, this.runSeed);
    this.isGameOver = false;
    this.isStageClear = false;

    const { worldWidth, worldHeight, start } = this.currentStage;

    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

    const platforms = this.createStageBlockout(this.currentStage.platforms);
    this.createGoal(this.currentStage);

    this.cursors = this.input.keyboard?.createCursorKeys();
    this.wasd = this.input.keyboard?.addKeys('A,D,J') as {
      A: Phaser.Input.Keyboard.Key;
      D: Phaser.Input.Keyboard.Key;
      J: Phaser.Input.Keyboard.Key;
    };
    this.restartKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.R);

    if (!this.cursors || !this.wasd) {
      throw new Error('Keyboard input is required for the Phase1 prototype.');
    }

    this.player = new Player(this, start.x, start.y, {
      left: this.wasd.A,
      right: this.wasd.D,
      jump: this.cursors.space,
      dash: this.cursors.shift,
      attack: this.wasd.J,
    });

    this.physics.add.collider(this.player, platforms);

    this.slimes = this.createSlimes(this.currentStage);
    this.physics.add.collider(this.slimes, platforms);
    this.physics.add.overlap(this.player, this.slimes, this.handlePlayerSlimeContact, undefined, this);

    if (!this.goalZone) {
      throw new Error('Stage goal is required.');
    }

    this.physics.add.overlap(this.player, this.goalZone, this.handleGoalReached, undefined, this);

    this.events.off('player-attack', this.handlePlayerAttack, this);
    this.events.off('player-damaged', this.handlePlayerDamaged, this);
    this.events.off('slime-damaged', this.handleSlimeDamaged, this);
    this.events.off('player-dead', this.handlePlayerDead, this);
    this.events.off('slime-defeated', this.handleSlimeDefeated, this);
    this.events.on('player-attack', this.handlePlayerAttack, this);
    this.events.on('player-damaged', this.handlePlayerDamaged, this);
    this.events.on('slime-damaged', this.handleSlimeDamaged, this);
    this.events.on('player-dead', this.handlePlayerDead, this);
    this.events.on('slime-defeated', this.handleSlimeDefeated, this);

    // 横スクロールアクションとして視界を安定させるため、プレイヤーを滑らかに追従する。
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setDeadzone(120, 80);

    this.addControlsText();
    this.addHud();
    this.updateHud();
  }

  update(time: number): void {
    if (this.isGameOver && this.restartKey && Phaser.Input.Keyboard.JustDown(this.restartKey)) {
      this.restartStage();
      return;
    }

    this.player?.update(time);

    if (this.player && this.slimes) {
      for (const slime of this.slimes.getChildren()) {
        if (slime instanceof Slime) {
          slime.update(this.player);
        }
      }
    }

    this.updateHud();
  }

  private createPlaceholderPlayerTexture(): void {
    const graphics = this.make.graphics({ x: 0, y: 0 }, false);

    // 仮プレイヤースプライト。後でアニメーション付きスプライトシートに差し替える。
    graphics.fillStyle(0xf2f4f8);
    graphics.fillRect(10, 6, 28, 42);
    graphics.fillStyle(0x53a6ff);
    graphics.fillRect(14, 10, 20, 12);
    graphics.fillStyle(0x101820);
    graphics.fillRect(30, 15, 4, 4);
    graphics.generateTexture('player-placeholder', 48, 56);
    graphics.destroy();
  }

  private createPlaceholderSlimeTexture(): void {
    const graphics = this.make.graphics({ x: 0, y: 0 }, false);

    graphics.fillStyle(0x6ee7a7);
    graphics.fillEllipse(24, 32, 40, 28);
    graphics.fillStyle(0x34a46f);
    graphics.fillEllipse(24, 25, 30, 18);
    graphics.fillStyle(0x101820);
    graphics.fillRect(15, 25, 4, 4);
    graphics.fillRect(29, 25, 4, 4);
    graphics.generateTexture('slime-placeholder', 48, 48);
    graphics.destroy();
  }

  private createStageBlockout(
    platformDefinitions: PlatformDefinition[],
  ): Phaser.Physics.Arcade.StaticGroup {
    const platforms = this.physics.add.staticGroup();

    const addPlatform = (definition: PlatformDefinition): void => {
      const platform = this.add.rectangle(
        definition.x,
        definition.y,
        definition.width,
        definition.height,
        definition.color,
      );
      platforms.add(platform);
    };

    for (const definition of platformDefinitions) {
      addPlatform(definition);
    }

    // StaticGroup に手動追加した矩形の物理ボディを最終サイズへ同期する。
    platforms.refresh();

    return platforms;
  }

  private createSlimes(stage: GeneratedStage): Phaser.GameObjects.Group {
    const slimes = this.add.group();

    for (const point of stage.slimeSpawns) {
      slimes.add(new Slime(this, point.x, point.y));
    }

    this.remainingSlimes = stage.slimeSpawns.length;

    return slimes;
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
    const text = this.add.text(16, 16, 'A/D: Move  Space: Jump/Double Jump  Shift: Dash  J: Attack  R: Restart', {
      color: '#d9e2ec',
      fontFamily: 'monospace',
      fontSize: '14px',
    });

    text.setScrollFactor(0);
  }

  private addHud(): void {
    this.playerHpBarBack = this.add.rectangle(16, 46, 180, 14, 0x1f2933);
    this.playerHpBarBack.setOrigin(0, 0.5);
    this.playerHpBarBack.setScrollFactor(0);
    this.playerHpBarBack.setDepth(50);

    this.playerHpBarFill = this.add.rectangle(18, 46, 176, 10, 0x4ade80);
    this.playerHpBarFill.setOrigin(0, 0.5);
    this.playerHpBarFill.setScrollFactor(0);
    this.playerHpBarFill.setDepth(51);

    this.hpText = this.add.text(204, 37, '', {
      color: '#f8fafc',
      fontFamily: 'monospace',
      fontSize: '14px',
    });
    this.hpText.setScrollFactor(0);
    this.hpText.setDepth(52);

    this.enemiesText = this.add.text(16, 64, '', {
      color: '#f8fafc',
      fontFamily: 'monospace',
      fontSize: '16px',
    });
    this.enemiesText.setScrollFactor(0);
    this.enemiesText.setDepth(52);

    this.stageText = this.add.text(16, 86, '', {
      color: '#cbd5e1',
      fontFamily: 'monospace',
      fontSize: '14px',
    });
    this.stageText.setScrollFactor(0);
    this.stageText.setDepth(52);

    this.seedText = this.add.text(16, 106, '', {
      color: '#94a3b8',
      fontFamily: 'monospace',
      fontSize: '13px',
    });
    this.seedText.setScrollFactor(0);
    this.seedText.setDepth(52);

    this.gameStateText = this.add.text(480, 160, '', {
      align: 'center',
      color: '#f8fafc',
      fontFamily: 'monospace',
      fontSize: '32px',
    });
    this.gameStateText.setOrigin(0.5);
    this.gameStateText.setScrollFactor(0);
    this.gameStateText.setDepth(80);

    this.redFlash = this.add.rectangle(480, 270, 960, 540, 0xff1f1f, 0);
    this.redFlash.setScrollFactor(0);
    this.redFlash.setDepth(70);
  }

  private updateHud(): void {
    if (!this.player || !this.hpText || !this.enemiesText || !this.stageText || !this.seedText || !this.playerHpBarFill) {
      return;
    }

    const hpRatio = Phaser.Math.Clamp(this.player.getHp() / this.player.getMaxHp(), 0, 1);
    this.playerHpBarFill.setSize(176 * hpRatio, 10);
    this.playerHpBarFill.setFillStyle(hpRatio <= 0.35 ? 0xfb7185 : 0x4ade80);
    this.hpText.setText(`HP: ${this.player.getHp()} / ${this.player.getMaxHp()}`);
    this.enemiesText.setText(`Slimes: ${this.remainingSlimes}`);
    this.stageText.setText(`Stage: ${this.stageIndex}`);
    this.seedText.setText(`Seed: ${this.runSeed}`);
  }

  private handlePlayerAttack(hitbox: PlayerAttackHitbox): void {
    if (!this.slimes || !this.player) {
      hitbox.destroy();
      return;
    }

    this.showAttackEffect(hitbox.x, hitbox.y);

    const hitSlimes = new Set<Slime>();
    const overlap = this.physics.add.overlap(hitbox, this.slimes, (_attack, target) => {
      if (!(target instanceof Slime) || !this.player || hitSlimes.has(target)) {
        return;
      }

      const direction = Math.sign(target.x - this.player.x) || this.player.getFacing();
      hitSlimes.add(target);
      target.takeDamage(15, direction * 260, -160, this.time.now);
    });

    this.time.delayedCall(this.player.getAttackDurationMs(), () => {
      overlap.destroy();
      hitbox.destroy();
    });
  }

  private handlePlayerSlimeContact(
    playerObject:
      | Phaser.Types.Physics.Arcade.GameObjectWithBody
      | Phaser.Physics.Arcade.Body
      | Phaser.Physics.Arcade.StaticBody
      | Phaser.Tilemaps.Tile,
    slimeObject:
      | Phaser.Types.Physics.Arcade.GameObjectWithBody
      | Phaser.Physics.Arcade.Body
      | Phaser.Physics.Arcade.StaticBody
      | Phaser.Tilemaps.Tile,
  ): void {
    if (!(playerObject instanceof Player) || !(slimeObject instanceof Slime) || slimeObject.getIsDead()) {
      return;
    }

    const direction = Math.sign(playerObject.x - slimeObject.x) || 1;
    playerObject.takeDamage(slimeObject.getContactDamage(), direction * 360, -220, this.time.now);
  }

  private handleSlimeDefeated(): void {
    this.remainingSlimes = Math.max(0, this.remainingSlimes - 1);

    if (this.remainingSlimes === 0 && this.gameStateText) {
      this.gameStateText.setText('Goal Open');
    }
  }

  private handleGoalReached(): void {
    if (this.isGameOver || this.isStageClear || this.remainingSlimes > 0) {
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

  private handleSlimeDamaged(event: DamagePopupEvent): void {
    this.showDamageNumber(event.x, event.y, event.damage, '#ffe082');
  }

  private showDamageNumber(x: number, y: number, damage: number, color: string): void {
    const text = this.add.text(x, y, `-${damage}`, {
      color,
      fontFamily: 'monospace',
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

  private showAttackEffect(x: number, y: number): void {
    const effect = this.add.ellipse(x, y, 64, 38, 0xb8f3ff, 0.34);
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
      this.scene.restart({ stageIndex: this.stageIndex + 1, runSeed: this.runSeed });
    });
  }

  private createHudButton(x: number, y: number, label: string): Phaser.GameObjects.Text {
    const button = this.add.text(x, y, label, {
      backgroundColor: '#e2e8f0',
      color: '#101820',
      fontFamily: 'monospace',
      fontSize: '20px',
      padding: {
        x: 18,
        y: 10,
      },
    });

    button.setOrigin(0.5);
    button.setScrollFactor(0);
    button.setDepth(90);
    button.setInteractive({ useHandCursor: true });

    return button;
  }

  private restartStage(): void {
    this.scene.restart({ stageIndex: this.stageIndex, runSeed: this.runSeed });
  }
}
