import { ClassDefinition } from './ClassDefinition';

export const PyromancerClass: ClassDefinition = {
  id: 'pyromancer',
  name: '火術師',

  hp: 84,
  attack: 14,
  speed: 0.9,

  attackCooldown: 340,
  attackType: 'ranged',
  projectileSpeed: 520,

  canCounter: false,
  specialName: '爆炎の盾',
  specialDescription: '範囲攻撃とDoTを得意とする火の魔術師。接触や範囲で炎ダメージを与える。',
};
