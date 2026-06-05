import { ClassDefinition } from './ClassDefinition';

<<<<<<< HEAD
export const BeastClass: ClassDefinition = {
  id: 'beast',
  name: '獣戦士',

  hp: 110,
  attack: 28,
  speed: 1.24,

  attackCooldown: 240,
  attackType: 'melee',

  canCounter: false,
  specialName: '狂乱',
  specialDescription: 'HPが減るほど攻撃力が上昇し、短時間攻撃速度と移動速度が増加する。',
=======
export const BeastWarrior: ClassDefinition = {
  id: 'beast-warrior',
  name: 'Beast Warrior',
  maxHp: 120,
  moveSpeed: 255,
  jumpPower: 520,
  skills: {
    skill1: {
      id: 'beast-warrior-rending-claw',
      slot: 'skill1',
      name: 'Rending Claw',
      description: 'Forward claw combo that knocks enemies upward.',
      cooldownMs: 260,
    },
    skill2: {
      id: 'beast-warrior-feral-pounce',
      slot: 'skill2',
      name: 'Feral Pounce',
      description: 'Charged leap slash with extended reach.',
      cooldownMs: 2200,
    },
    ultimate: {
      id: 'beast-warrior-primal-roar',
      slot: 'ultimate',
      name: 'Primal Roar',
      description: 'Counter roar that punishes contact attacks.',
      cooldownMs: 5200,
    },
  },
>>>>>>> f2a20ba (Add class and input systems)
};
