import { ClassDefinition } from './ClassDefinition';

export const FrostLancer: ClassDefinition = {
  id: 'frost-lancer',
  name: 'Frost Lancer',
  description: 'Mid-range lancer that controls space with ice spears, slows, and freezing thrusts.',
  maxHp: 95,
  moveSpeed: 245,
  jumpPower: 530,
  skills: {
    skill1: {
      id: 'frost-lancer-ice-piercer',
      slot: 'skill1',
      name: 'Ice Piercer',
      description: 'Long frost thrust that can freeze enemies.',
      cooldownMs: 1000,
    },
    skill2: {
      id: 'frost-lancer-glacier-line',
      slot: 'skill2',
      name: 'Glacier Line',
      description: 'Long frost lane that freezes targets.',
      cooldownMs: 2300,
    },
    ultimate: {
      id: 'frost-lancer-crystal-prison',
      slot: 'ultimate',
      name: 'Crystal Prison',
      description: 'Large freezing burst around the lancer.',
      cooldownMs: 5400,
    },
  },
};
