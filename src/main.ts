import Phaser from 'phaser';
import { ClassSelectionScene } from './scenes/ClassSelectionScene';
import { GameScene } from './scenes/GameScene';
import { InventoryScene } from './scenes/InventoryScene';
import { MetaShopScene } from './scenes/MetaShopScene';
import { SkillTreeScene } from './scenes/SkillTreeScene';
import './styles.css';

const originalTextFactory = Phaser.GameObjects.GameObjectFactory.prototype.text;
Phaser.GameObjects.GameObjectFactory.prototype.text = function (x, y, text, style) {
  const patchedStyle = style && style.fontFamily === 'monospace'
    ? { ...style, fontFamily: 'DotGothic16, monospace' }
    : style;
  return originalTextFactory.call(this, x, y, text, patchedStyle);
};

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 960,
  height: 540,
  backgroundColor: '#101820',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 1200 },
      debug: false,
    },
  },
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [ClassSelectionScene, GameScene, InventoryScene, MetaShopScene, SkillTreeScene],
};

new Phaser.Game(config);
