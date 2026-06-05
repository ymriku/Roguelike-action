import { ClassDefinition } from './ClassDefinition';

export const MachinistClass: ClassDefinition = {
  id: 'machinist',
  name: '機工士',

  hp: 92,
  attack: 15,
  speed: 1.0,

  attackCooldown: 300,
  attackType: 'ranged',
  projectileSpeed: 560,

  canCounter: false,
  specialName: 'オーバードライブ',
  specialDescription: '設置物で戦場をコントロールし、一定時間攻撃速度が上がる。',
};
