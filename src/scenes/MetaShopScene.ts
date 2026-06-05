import Phaser from 'phaser';
import { MetaProgression } from '../systems/MetaProgression';
import { Items } from '../items/Item';

export class MetaShopScene extends Phaser.Scene {
  constructor() {
    super('MetaShopScene');
  }

  create(): void {
    this.add.rectangle(480, 270, 700, 420, 0x07111d, 0.94).setOrigin(0.5).setDepth(80);
    this.add.rectangle(480, 120, 560, 60, 0x13213c, 0.92).setOrigin(0.5).setDepth(81);
    this.add.text(480, 120, 'Meta Shop', { fontFamily: 'DotGothic16, monospace', fontSize: '28px', color: '#f8fafc', fontStyle: 'bold' }).setOrigin(0.5).setDepth(82);

    const close = this.add.text(840, 80, 'Close', { fontFamily: 'DotGothic16, monospace', fontSize: '16px', color: '#101820', backgroundColor: '#d9e2ec', padding: { x: 10, y: 6 } }).setInteractive({ useHandCursor: true }).setDepth(82);
    close.on('pointerdown', () => this.scene.stop());
    close.on('pointerover', () => close.setStyle({ backgroundColor: '#fbbf24' }));
    close.on('pointerout', () => close.setStyle({ backgroundColor: '#d9e2ec' }));

    const points = MetaProgression.getPoints();
    this.add.text(480, 160, `Meta Points: ${points}`, { fontFamily: 'DotGothic16, monospace', fontSize: '18px', color: '#cbd5e1' }).setOrigin(0.5).setDepth(81);
    this.add.text(480, 182, 'Spend your points on consumables and artifacts.', { fontFamily: 'DotGothic16, monospace', fontSize: '13px', color: '#94a3b8' }).setOrigin(0.5).setDepth(81);

    const shopItems = [
      { item: Items.potion, cost: 4 },
      { item: Items.speedTonic, cost: 5 },
      { item: Items.strengthElixir, cost: 6 },
      { item: Items.minorArtifact, cost: 10 },
      { item: Items.rareArtifact, cost: 16 },
    ];

    shopItems.forEach((entry, idx) => {
      const y = 230 + idx * 50;
      this.add.rectangle(480, y, 620, 44, 0x0f1e33, 0.9).setOrigin(0.5).setDepth(81);
      this.add.text(180, y, `${entry.item.name}`, { fontFamily: 'DotGothic16, monospace', fontSize: '16px', color: '#e2e8f0' }).setOrigin(0, 0.5).setDepth(82);
      this.add.text(180, y + 16, entry.item.description ?? '', { fontFamily: 'DotGothic16, monospace', fontSize: '12px', color: '#94a3b8' }).setOrigin(0, 0.5).setDepth(82);
      this.add.text(520, y, `${entry.cost} MP`, { fontFamily: 'DotGothic16, monospace', fontSize: '14px', color: '#ffd166' }).setOrigin(0.5).setDepth(82);

      const buyBtn = this.add.text(680, y, 'Buy', { fontFamily: 'DotGothic16, monospace', fontSize: '14px', color: '#101820', backgroundColor: '#fbbf24', padding: { x: 10, y: 6 } }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(82);
      buyBtn.on('pointerover', () => buyBtn.setStyle({ backgroundColor: '#ffd166' }));
      buyBtn.on('pointerout', () => buyBtn.setStyle({ backgroundColor: '#fbbf24' }));
      buyBtn.on('pointerdown', () => {
        if (MetaProgression.spendPoints(entry.cost)) {
          this.game.events.emit('item-drop', { x: 480, y: 320, itemId: entry.item.id });
        }
        this.scene.restart();
      });
    });
  }
}
