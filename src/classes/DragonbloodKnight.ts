import { ClassDefinition } from './ClassDefinition';

export const DragonbloodClass: ClassDefinition = {
  id: 'dragonblood',
  name: '竜血騎士',

  hp: 150,
  attack: 34,
  speed: 0.86,

  attackCooldown: 400,
  attackType: 'melee',

  maxJumpCount: 1,
  dashCooldown: 420,
  canCounter: true,
  specialName: '竜血解放',
  specialDescription: '攻撃力が上昇し、攻撃に炎属性を付与する重戦士。',
};
