import Phaser from 'phaser';
import { classList } from '../classes';
import { ClassDefinition } from '../classes/ClassDefinition';
import { createRunSeed } from '../systems/StageGenerator';

export class ClassSelectionScene extends Phaser.Scene {
  private selectedClassId: ClassDefinition['id'] = 'samurai';
  private selectedCard?: Phaser.GameObjects.Container;

  constructor() {
    super('ClassSelectionScene');
  }

  create(): void {
    this.add.text(480, 40, 'Class Selection', {
      fontFamily: 'DotGothic16, monospace',
      fontSize: '32px',
      color: '#f8fafc',
    }).setOrigin(0.5);

    const startButton = this.add.text(480, 500, 'Start Adventure', {
      fontFamily: 'DotGothic16, monospace',
      fontSize: '22px',
      color: '#101820',
      backgroundColor: '#d9e2ec',
      padding: { x: 18, y: 10 },
    }).setOrigin(0.5);

    startButton.setInteractive({ useHandCursor: true });
    startButton.on('pointerdown', () => {
      this.scene.start('GameScene', {
        stageIndex: 1,
        runSeed: createRunSeed(),
        selectedClassId: this.selectedClassId,
      });
    });

    // 動的にカード位置を生成（列数3、行数は classList に合わせる）
    const cols = 3;
    const spacingX = 320;
    const spacingY = 160;
    const startX = 160;
    const startY = 140;

    classList.forEach((classDef, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = startX + col * spacingX;
      const y = startY + row * spacingY;
      const card = this.createClassCard(classDef, x, y);
      if (classDef.id === this.selectedClassId) {
        this.setCardSelected(card);
      }
    });

    this.add.text(480, 560, 'Click a class card to select. A/D move, Space jump, Shift dash, J/K/L skills.', {
      fontFamily: 'DotGothic16, monospace',
      fontSize: '14px',
      color: '#94a3b8',
    }).setOrigin(0.5);
  }

  private createClassCard(classDef: ClassDefinition, x: number, y: number): Phaser.GameObjects.Container {
    const base = this.add.rectangle(0, 0, 280, 130, 0x1f2933);
    const title = this.add.text(-130, -48, classDef.name, {
      fontFamily: 'DotGothic16, monospace',
      fontSize: '20px',
      color: '#f8fafc',
    });
    const hp = this.add.text(-130, -18, `HP: ${classDef.maxHp}`, {
      fontFamily: 'DotGothic16, monospace',
      fontSize: '14px',
      color: '#d9e2ec',
    });
    const speed = this.add.text(-130, 2, `SPD: ${classDef.moveSpeed}`, {
      fontFamily: 'DotGothic16, monospace',
      fontSize: '14px',
      color: '#d9e2ec',
    });
    const jump = this.add.text(-130, 22, `JMP: ${classDef.jumpPower}`, {
      fontFamily: 'DotGothic16, monospace',
      fontSize: '14px',
      color: '#d9e2ec',
    });
    const special = this.add.text(-130, 44, classDef.skills.ultimate.name, {
      fontFamily: 'DotGothic16, monospace',
      fontSize: '12px',
      color: '#94a3b8',
    });

    const card = this.add.container(x, y, [base, title, hp, speed, jump, special]);
    card.setSize(280, 130);
    card.setInteractive({ useHandCursor: true });
    card.on('pointerdown', () => {
      this.selectedClassId = classDef.id;
      this.setCardSelected(card);
    });

    return card;
  }

  private setCardSelected(card: Phaser.GameObjects.Container): void {
    if (this.selectedCard === card) {
      return;
    }

    if (this.selectedCard) {
      const previousBackground = this.selectedCard.list[0] as Phaser.GameObjects.Rectangle;
      previousBackground.setStrokeStyle(0);
    }

    this.selectedCard = card;
    const background = card.list[0] as Phaser.GameObjects.Rectangle;
    background.setStrokeStyle(4, 0xfbbf24);
  }
}
