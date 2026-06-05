import { ClassDefinition } from './ClassDefinition';

export const Pyromancer: ClassDefinition = {
  id: 'pyromancer',
  name: 'Pyromancer',
  description: 'Fragile flame caster using fireballs, burn zones, and wide flame bursts.',
  maxHp: 85,
  moveSpeed: 235,
  jumpPower: 505,
  skills: {
    skill1: {
      id: 'pyromancer-flame-wave',
      slot: 'skill1',
      name: 'Flame Wave',
      description: 'Wide close-range flame sweep that burns enemies.',
      cooldownMs: 1100,
    },
    skill2: {
      id: 'pyromancer-flare-burst',
      slot: 'skill2',
      name: 'Flare Burst',
      description: 'Large forward flame burst with burn damage.',
      cooldownMs: 2600,
    },
    ultimate: {
      id: 'pyromancer-inferno',
      slot: 'ultimate',
      name: 'Inferno',
      description: 'Very wide flame detonation around the caster.',
      cooldownMs: 5800,
    },
  },
};
