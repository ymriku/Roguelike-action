import { ClassDefinition } from './ClassDefinition';

<<<<<<< HEAD
export const MachinistClass: ClassDefinition = {
  id: 'machinist',
  name: '機工士',

  hp: 92,
  attack: 15,
  speed: 1.0,

  attackCooldown: 300,
  attackType: 'ranged',
  projectileSpeed: 560,

  canCounter: false,
  specialName: 'オーバードライブ',
  specialDescription: '設置物で戦場をコントロールし、一定時間攻撃速度が上がる。',
=======
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
>>>>>>> f2a20ba (Add class and input systems)
};
