import { ClassDefinition } from './ClassDefinition';

<<<<<<< HEAD
export const FrostLancerClass: ClassDefinition = {
  id: 'frostlancer',
  name: '氷槍士',

  hp: 100,
  attack: 20,
  speed: 1.0,

  attackCooldown: 300,
  attackType: 'ranged',
  projectileSpeed: 600,

  maxJumpCount: 2,
  canCounter: false,
  specialName: '氷結突き',
  specialDescription: '貫通する氷槍で敵をスローし、近距離命中で短時間凍結させる。',
=======
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
>>>>>>> f2a20ba (Add class and input systems)
};
