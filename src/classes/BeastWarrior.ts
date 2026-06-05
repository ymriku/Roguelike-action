import { ClassDefinition } from './ClassDefinition';

export const BeastClass: ClassDefinition = {
  id: 'beast',
  name: '獣戦士',

  hp: 110,
  attack: 28,
  speed: 1.24,

  attackCooldown: 240,
  attackType: 'melee',

  canCounter: false,
  specialName: '狂乱',
  specialDescription: 'HPが減るほど攻撃力が上昇し、短時間攻撃速度と移動速度が増加する。',
};
