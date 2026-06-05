import Phaser from 'phaser';
import { PlayerClassId, classList } from '../classes';
import { ClassDefinition } from '../classes/ClassDefinition';
import { SaveSystem } from '../systems/SaveSystem';
import { createRunSeed } from '../systems/StageGenerator';

const CLASS_ICON_URLS: Record<PlayerClassId, string> = {
  'beast-warrior': new URL('../../assets/icons/classes/beast-warrior.png', import.meta.url).toString(),
  'dragoonblood-knight': new URL('../../assets/icons/classes/dragoonblood-knight.png', import.meta.url).toString(),
  'frost-lancer': new URL('../../assets/icons/classes/frost-lancer.png', import.meta.url).toString(),
  machinist: new URL('../../assets/icons/classes/machinist.png', import.meta.url).toString(),
  pyromancer: new URL('../../assets/icons/classes/pyromancer.png', import.meta.url).toString(),
  samurai: new URL('../../assets/icons/classes/samurai.png', import.meta.url).toString(),
};

export class ClassSelectionScene extends Phaser.Scene {
  private selectedClassId: ClassDefinition['id'] = SaveSystem.getSelectedClassId();
  private selectedCard?: Phaser.GameObjects.Container;
  private selectedNameText?: Phaser.GameObjects.Text;
  private selectedDescriptionText?: Phaser.GameObjects.Text;
  private selectedStatsText?: Phaser.GameObjects.Text;
  private selectedSkillTexts: Phaser.GameObjects.Text[] = [];
  private selectedIcon?: Phaser.GameObjects.Image;

  constructor() {
    super('ClassSelectionScene');
  }

  preload(): void {
    classList.forEach((classDef) => {
      this.load.image(this.getClassIconKey(classDef.id), CLASS_ICON_URLS[classDef.id]);
    });
  }

  create(): void {
    this.add.text(480, 40, 'Class Selection', {
      fontFamily: 'DotGothic16, monospace',
      fontSize: '32px',
      color: '#f8fafc',
    }).setOrigin(0.5);

    const detailBack = this.add.rectangle(730, 286, 388, 388, 0x101820, 0.94);
    detailBack.setStrokeStyle(2, 0x334155);
    this.add.text(730, 112, 'Selected Class', {
      fontFamily: 'DotGothic16, monospace',
      fontSize: '18px',
      color: '#fbbf24',
    }).setOrigin(0.5);

    this.selectedIcon = this.add.image(576, 156, this.getClassIconKey(this.selectedClassId));
    this.selectedIcon.setScale(2.5);
    this.selectedNameText = this.add.text(622, 138, '', {
      fontFamily: 'DotGothic16, monospace',
      fontSize: '22px',
      color: '#f8fafc',
    });
    this.selectedDescriptionText = this.add.text(576, 188, '', {
      fontFamily: 'DotGothic16, monospace',
      fontSize: '13px',
      color: '#cbd5e1',
      lineSpacing: 4,
      wordWrap: { width: 308 },
    });
    this.selectedStatsText = this.add.text(576, 258, '', {
      fontFamily: 'DotGothic16, monospace',
      fontSize: '13px',
      color: '#94a3b8',
    });

    this.selectedSkillTexts = ['Skill1', 'Skill2', 'Ultimate'].map((label, index) => {
      this.add.text(576, 300 + index * 48, label, {
        fontFamily: 'DotGothic16, monospace',
        fontSize: '12px',
        color: '#fbbf24',
      });
      return this.add.text(646, 300 + index * 48, '', {
        fontFamily: 'DotGothic16, monospace',
        fontSize: '12px',
        color: '#e2e8f0',
        lineSpacing: 3,
        wordWrap: { width: 246 },
      });
    });

    const startButton = this.add.text(730, 482, 'Start Adventure', {
      fontFamily: 'DotGothic16, monospace',
      fontSize: '22px',
      color: '#101820',
      backgroundColor: '#d9e2ec',
      padding: { x: 18, y: 10 },
    }).setOrigin(0.5);

    startButton.setInteractive({ useHandCursor: true });
    startButton.on('pointerdown', () => {
      SaveSystem.setSelectedClassId(this.selectedClassId);
      this.scene.start('GameScene', {
        stageIndex: 1,
        runSeed: createRunSeed(),
        selectedClassId: this.selectedClassId,
      });
    });

    const cols = 2;
    const spacingX = 252;
    const spacingY = 126;
    const startX = 156;
    const startY = 132;

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

    this.updateSelectedDetails();

    this.add.text(480, 526, 'Click a class card to select. PC: A/D move, Space jump, F/J attack, Shift dash, Z/X/C or K/L/I skills.', {
      fontFamily: 'DotGothic16, monospace',
      fontSize: '14px',
      color: '#94a3b8',
    }).setOrigin(0.5);
  }

  private createClassCard(classDef: ClassDefinition, x: number, y: number): Phaser.GameObjects.Container {
    const isUnlocked = SaveSystem.isClassUnlocked(classDef.id);
    const base = this.add.rectangle(0, 0, 232, 104, isUnlocked ? 0x1f2933 : 0x111827, isUnlocked ? 0.96 : 0.68);
    const icon = this.add.image(-88, -28, this.getClassIconKey(classDef.id));
    icon.setScale(1.5);
    icon.setAlpha(isUnlocked ? 1 : 0.45);
    const title = this.add.text(-52, -42, classDef.name, {
      fontFamily: 'DotGothic16, monospace',
      fontSize: classDef.name.length > 16 ? '14px' : '16px',
      color: isUnlocked ? '#f8fafc' : '#64748b',
    });
    const selectedLabel = this.add.text(78, -42, classDef.id === this.selectedClassId ? 'Selected' : '', {
      fontFamily: 'DotGothic16, monospace',
      fontSize: '11px',
      color: '#fbbf24',
    });
    const description = this.add.text(-104, -6, classDef.description, {
      fontFamily: 'DotGothic16, monospace',
      fontSize: '11px',
      color: isUnlocked ? '#cbd5e1' : '#64748b',
      lineSpacing: 2,
      wordWrap: { width: 196 },
    });
    const stats = this.add.text(-104, 34, `HP ${classDef.maxHp}  SPD ${classDef.moveSpeed}  JMP ${classDef.jumpPower}`, {
      fontFamily: 'DotGothic16, monospace',
      fontSize: '12px',
      color: isUnlocked ? '#94a3b8' : '#475569',
    });
    const lock = this.add.text(0, 0, isUnlocked ? '' : 'Locked', {
      fontFamily: 'DotGothic16, monospace',
      fontSize: '18px',
      color: '#f87171',
      backgroundColor: '#111827',
      padding: { x: 8, y: 4 },
    }).setOrigin(0.5);

    const card = this.add.container(x, y, [base, icon, title, selectedLabel, description, stats, lock]);
    card.setData('classId', classDef.id);
    card.setData('selectedLabel', selectedLabel);
    card.setSize(232, 104);
    card.setInteractive({ useHandCursor: true });
    card.on('pointerdown', () => {
      if (!isUnlocked) {
        return;
      }
      this.selectedClassId = classDef.id;
      SaveSystem.setSelectedClassId(classDef.id);
      this.setCardSelected(card);
      this.updateSelectedDetails();
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
      const previousLabel = this.selectedCard.getData('selectedLabel') as Phaser.GameObjects.Text | undefined;
      previousLabel?.setText('');
    }

    this.selectedCard = card;
    const background = card.list[0] as Phaser.GameObjects.Rectangle;
    background.setStrokeStyle(4, 0xfbbf24);
    const selectedLabel = card.getData('selectedLabel') as Phaser.GameObjects.Text | undefined;
    selectedLabel?.setText('Selected');
  }

  private updateSelectedDetails(): void {
    const selectedClass = classList.find((classDef) => classDef.id === this.selectedClassId) ?? classList[0];
    this.selectedIcon?.setTexture(this.getClassIconKey(selectedClass.id));
    this.selectedNameText?.setText(selectedClass.name);
    this.selectedDescriptionText?.setText(selectedClass.description);
    this.selectedStatsText?.setText(`HP ${selectedClass.maxHp}   Speed ${selectedClass.moveSpeed}   Jump ${selectedClass.jumpPower}`);

    const skills = [
      selectedClass.skills.skill1,
      selectedClass.skills.skill2,
      selectedClass.skills.ultimate,
    ];

    this.selectedSkillTexts.forEach((text, index) => {
      const skill = skills[index];
      text.setText(`${skill.name}\n${skill.description}`);
    });
  }

  private getClassIconKey(classId: PlayerClassId): string {
    return `class-icon-${classId}`;
  }
}
