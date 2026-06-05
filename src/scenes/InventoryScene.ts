import Phaser from 'phaser';
import { Item } from '../items/Item';
import { Inventory, ItemStack } from '../systems/Inventory';

export class InventoryScene extends Phaser.Scene {
  private inventory?: Inventory;
  private items: ItemStack[] = [];

  constructor() {
    super('InventoryScene');
  }

  init(data: { inventory?: Inventory }) {
    this.inventory = data.inventory;
    this.items = this.inventory?.getAll() ?? [];
  }

  create(): void {
    this.add.rectangle(480, 270, 760, 420, 0x071625, 0.92).setOrigin(0.5).setDepth(80);
    this.add.rectangle(480, 100, 540, 64, 0x13223a, 0.94).setOrigin(0.5).setDepth(81);
    this.add.text(480, 100, 'Inventory', { fontFamily: 'DotGothic16, monospace', fontSize: '28px', color: '#f8fafc', fontStyle: 'bold' }).setOrigin(0.5).setDepth(82);

    const close = this.add.text(840, 80, 'Close', { fontFamily: 'DotGothic16, monospace', fontSize: '16px', color: '#101820', backgroundColor: '#d9e2ec', padding: { x: 10, y: 6 } }).setInteractive({ useHandCursor: true }).setDepth(82);
    close.on('pointerdown', () => this.scene.stop());
    close.on('pointerover', () => close.setStyle({ backgroundColor: '#fbbf24' }));
    close.on('pointerout', () => close.setStyle({ backgroundColor: '#d9e2ec' }));

    const startY = 170;
    if (this.items.length === 0) {
      this.add.text(260, startY, 'No items in inventory.', { fontFamily: 'DotGothic16, monospace', fontSize: '18px', color: '#94a3b8' }).setOrigin(0, 0.5).setDepth(81);
      return;
    }

    this.items.forEach((stack, idx) => {
      const y = startY + idx * 56;
      this.add.rectangle(480, y, 700, 46, 0x0f1b2b, 0.84).setOrigin(0.5).setDepth(81);
      this.add.text(155, y - 10, `${stack.item.name} x${stack.quantity}`, { fontFamily: 'DotGothic16, monospace', fontSize: '18px', color: '#e2e8f0' }).setOrigin(0, 0.5).setDepth(82);
      this.add.text(155, y + 10, stack.item.description ?? '', { fontFamily: 'DotGothic16, monospace', fontSize: '12px', color: '#94a3b8' }).setOrigin(0, 0.5).setDepth(82);

      const btn = this.add.text(760, y, stack.item.kind === 'consumable' ? 'Use' : 'Activate', { fontFamily: 'DotGothic16, monospace', fontSize: '14px', color: '#101820', backgroundColor: '#fbbf24', padding: { x: 10, y: 6 } }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(82);
      btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#ffd166' }));
      btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#fbbf24' }));

      btn.on('pointerdown', () => {
        const removed = this.inventory?.remove(idx);
        if (!removed) return;
        this.game.events.emit('use-item', { itemId: removed.id, index: idx });
        this.scene.restart({ inventory: this.inventory });
      });
    });
  }
}
