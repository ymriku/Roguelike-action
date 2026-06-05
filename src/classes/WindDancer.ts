import { ClassDefinition } from './ClassDefinition';

export const WindDancerClass: ClassDefinition = {
  id: 'winddancer',
  name: '風舞踊家',

  hp: 88,
  attack: 16,
  speed: 1.34,

  attackCooldown: 220,
  attackType: 'melee',

  maxJumpCount: 3,
  dashCooldown: 220,
  canCounter: false,
  specialName: 'エアダンス',
  specialDescription: '空中での機動力と回避に優れ、コンボを得意とする。',
};
