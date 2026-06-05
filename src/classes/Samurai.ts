import { ClassDefinition } from './ClassDefinition';

<<<<<<< HEAD
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
=======
export const Samurai: ClassDefinition = {
  id: 'samurai',
  name: 'Samurai',
  maxHp: 100,
  moveSpeed: 240,
  jumpPower: 520,
  skills: {
    skill1: {
      id: 'samurai-combo-cut',
      slot: 'skill1',
      name: 'Combo Cut',
      description: 'Three-hit katana chain with a finisher knockback.',
      cooldownMs: 260,
    },
    skill2: {
      id: 'samurai-iaido',
      slot: 'skill2',
      name: 'Iaido',
      description: 'Hold and release for a charged draw slash.',
      cooldownMs: 2400,
    },
    ultimate: {
      id: 'samurai-mind-counter',
      slot: 'ultimate',
      name: 'Mind Counter',
      description: 'Brief counter stance that retaliates when struck.',
      cooldownMs: 2600,
    },
  },
};
>>>>>>> f2a20ba (Add class and input systems)
