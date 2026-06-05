import { ClassDefinition } from './ClassDefinition';

export const Samurai: ClassDefinition = {
  id: 'samurai',
  name: 'Samurai',
  description: 'Balanced katana fighter with clean mobility, quick strings, and a defensive counter.',
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
