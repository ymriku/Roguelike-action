import { ClassDefinition } from './ClassDefinition';

<<<<<<< HEAD
export const PyromancerClass: ClassDefinition = {
  id: 'pyromancer',
  name: '火術師',

  hp: 84,
  attack: 14,
  speed: 0.9,

  attackCooldown: 340,
  attackType: 'ranged',
  projectileSpeed: 520,

  canCounter: false,
  specialName: '爆炎の盾',
  specialDescription: '範囲攻撃とDoTを得意とする火の魔術師。接触や範囲で炎ダメージを与える。',
=======
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
>>>>>>> f2a20ba (Add class and input systems)
};
