import { ClassDefinition } from './ClassDefinition';

export const Pyromancer: ClassDefinition = {
  id: 'pyromancer',
  name: 'Pyromancer',
  maxHp: 85,
  moveSpeed: 235,
  jumpPower: 505,
  skills: {
    skill1: {
      id: 'pyromancer-ember-slash',
      slot: 'skill1',
      name: 'Ember Slash',
      description: 'Close flame swipe with fast startup.',
      cooldownMs: 300,
    },
    skill2: {
      id: 'pyromancer-flare-brand',
      slot: 'skill2',
      name: 'Flare Brand',
      description: 'Charged flame brand that hits a wider area.',
      cooldownMs: 2600,
    },
    ultimate: {
      id: 'pyromancer-phoenix-ward',
      slot: 'ultimate',
      name: 'Phoenix Ward',
      description: 'Heat ward that counters with a burst of fire.',
      cooldownMs: 5800,
    },
  },
};
