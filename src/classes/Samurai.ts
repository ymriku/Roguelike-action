import { ClassDefinition } from './ClassDefinition';

export const SamuraiClass: ClassDefinition = {
  id: 'samurai',
  name: '侍',

  hp: 120,
  attack: 25,
  speed: 1.0,

  attackCooldown: 360,
  attackType: 'melee',

  maxJumpCount: 2,
  dashCooldown: 420,

  canCounter: true,
  specialName: '居合',
  specialDescription: 'カウンターを活かして一気に反撃する。',
};