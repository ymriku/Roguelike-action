import { ClassDefinition } from './ClassDefinition';

export const FrostLancer: ClassDefinition = {
  id: 'frost-lancer',
  name: 'Frost Lancer',
  maxHp: 95,
  moveSpeed: 245,
  jumpPower: 530,
  skills: {
    skill1: {
      id: 'frost-lancer-ice-piercer',
      slot: 'skill1',
      name: 'Ice Piercer',
      description: 'Precise jab that keeps enemies at mid range.',
      cooldownMs: 280,
    },
    skill2: {
      id: 'frost-lancer-glacier-line',
      slot: 'skill2',
      name: 'Glacier Line',
      description: 'Charged frost lane with long reach.',
      cooldownMs: 2300,
    },
    ultimate: {
      id: 'frost-lancer-crystal-aegis',
      slot: 'ultimate',
      name: 'Crystal Aegis',
      description: 'Defensive parry that bursts into frozen shards.',
      cooldownMs: 5400,
    },
  },
};
