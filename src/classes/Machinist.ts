import { ClassDefinition } from './ClassDefinition';

export const Machinist: ClassDefinition = {
  id: 'machinist',
  name: 'Machinist',
  maxHp: 90,
  moveSpeed: 240,
  jumpPower: 500,
  skills: {
    skill1: {
      id: 'machinist-bayonet-burst',
      slot: 'skill1',
      name: 'Bayonet Burst',
      description: 'Short-range mechanical strike with steady recovery.',
      cooldownMs: 240,
    },
    skill2: {
      id: 'machinist-rail-charge',
      slot: 'skill2',
      name: 'Rail Charge',
      description: 'Charged rail shot that pierces forward.',
      cooldownMs: 2100,
    },
    ultimate: {
      id: 'machinist-auto-guard',
      slot: 'ultimate',
      name: 'Auto Guard',
      description: 'Reactive barrier that fires a counter blast.',
      cooldownMs: 5000,
    },
  },
};
