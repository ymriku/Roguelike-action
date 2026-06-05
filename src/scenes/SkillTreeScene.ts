import Phaser from 'phaser';
import { MetaProgression } from '../systems/MetaProgression';
import { SkillTrees, canUnlockSkill, getPurchasedSkills, isSkillPurchased, unlockSkill, SkillTree } from '../skills/SkillTree';
import { ClassDefinition, classMap } from '../classes';

type SkillTreeSceneData = {
  selectedClassId?: ClassDefinition['id'];
};

export class SkillTreeScene extends Phaser.Scene {
  private selectedClassId: ClassDefinition['id'] = 'samurai';

  constructor() {
    super('SkillTreeScene');
  }

  init(data: SkillTreeSceneData): void {
    this.selectedClassId = data.selectedClassId ?? 'samurai';
  }

  create(): void {
    this.add.rectangle(480, 270, 760, 440, 0x08101a, 0.96).setOrigin(0.5).setDepth(80);
    this.add.rectangle(480, 100, 560, 64, 0x13213d, 0.94).setOrigin(0.5).setDepth(81);
    this.add.text(480, 100, 'Skill Tree', { fontFamily: 'DotGothic16, monospace', fontSize: '28px', color: '#f8fafc', fontStyle: 'bold' }).setOrigin(0.5).setDepth(82);

    const close = this.add.text(840, 80, 'Close', { fontFamily: 'DotGothic16, monospace', fontSize: '16px', color: '#101820', backgroundColor: '#d9e2ec', padding: { x: 10, y: 6 } }).setInteractive({ useHandCursor: true }).setDepth(82);
    close.on('pointerdown', () => this.scene.stop());
    close.on('pointerover', () => close.setStyle({ backgroundColor: '#fbbf24' }));
    close.on('pointerout', () => close.setStyle({ backgroundColor: '#d9e2ec' }));

    const className = classMap[this.selectedClassId]?.name ?? 'Unknown';
    this.add.text(480, 140, `${className} Skills`, { fontFamily: 'DotGothic16, monospace', fontSize: '18px', color: '#cbd5e1' }).setOrigin(0.5).setDepth(81);
    const points = MetaProgression.getPoints();
    this.add.text(480, 164, `Meta Points: ${points}`, { fontFamily: 'DotGothic16, monospace', fontSize: '14px', color: '#94a3b8' }).setOrigin(0.5).setDepth(81);

    const skillTree: SkillTree = SkillTrees[this.selectedClassId] ?? {};
    const nodes = Object.values(skillTree);
    if (nodes.length === 0) {
      this.add.text(480, 240, 'No skill tree available for this class.', { fontFamily: 'DotGothic16, monospace', fontSize: '18px', color: '#f8fafc' }).setOrigin(0.5).setDepth(81);
      return;
    }

    nodes.forEach((node, idx) => {
      const y = 210 + idx * 58;
      const isPurchased = isSkillPurchased(this.selectedClassId, node.id);
      const prereqOk = canUnlockSkill(this.selectedClassId, node.id);
      const label = isPurchased ? 'Purchased' : prereqOk ? 'Unlock' : 'Locked';
      const color = isPurchased ? '#4ade80' : prereqOk ? '#101820' : '#94a3b8';
      const bg = isPurchased ? 0x164e3a : prereqOk ? 0x2563eb : 0x1e293b;

      this.add.rectangle(480, y, 700, 54, bg, 0.9).setOrigin(0.5).setDepth(81);
      this.add.text(170, y - 10, node.name, { fontFamily: 'DotGothic16, monospace', fontSize: '16px', color: '#f8fafc' }).setOrigin(0, 0.5).setDepth(82);
      this.add.text(170, y + 10, node.description ?? '', { fontFamily: 'DotGothic16, monospace', fontSize: '12px', color: '#cbd5e1' }).setOrigin(0, 0.5).setDepth(82);
      this.add.text(400, y, `Cost ${node.cost}`, { fontFamily: 'DotGothic16, monospace', fontSize: '14px', color: '#ffd166' }).setOrigin(0, 0.5).setDepth(82);

      const btn = this.add.text(700, y, label, { fontFamily: 'DotGothic16, monospace', fontSize: '14px', color, backgroundColor: isPurchased ? '#0f172a' : prereqOk ? '#7dd3fc' : '#334155', padding: { x: 10, y: 6 } }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(82);
      btn.on('pointerover', () => {
        if (!isPurchased && prereqOk) {
          btn.setStyle({ backgroundColor: '#38bdf8' });
        }
      });
      btn.on('pointerout', () => {
        if (!isPurchased && prereqOk) {
          btn.setStyle({ backgroundColor: '#7dd3fc' });
        }
      });

      btn.on('pointerdown', () => {
        if (isPurchased || !prereqOk || points < node.cost) {
          return;
        }
        if (unlockSkill(this.selectedClassId, node.id)) {
          MetaProgression.spendPoints(node.cost);
          this.game.events.emit('skill-unlocked', { skillId: node.id });
          this.scene.restart({ selectedClassId: this.selectedClassId });
        }
      });
    });
  }
}
