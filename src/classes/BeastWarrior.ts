import { ClassDefinition } from './ClassDefinition';

export const BeastWarrior: ClassDefinition = {
  id: 'beast-warrior',
  name: 'Beast Warrior',
  description: 'Aggressive bruiser with high health, fast pressure, and powerful close-range control.',
  maxHp: 120,
  moveSpeed: 255,
  jumpPower: 520,
  skills: {
    skill1: {
      id: 'beast-warrior-rending-claw',
      slot: 'skill1',
      name: 'Rending Claw',
      description: 'Forward claw lunge that bleeds enemies.',
      cooldownMs: 900,
    },
    skill2: {
      id: 'beast-warrior-feral-pounce',
      slot: 'skill2',
      name: 'Feral Pounce',
      description: 'Leaping pounce with strong upward knockback.',
      cooldownMs: 2200,
    },
    ultimate: {
      id: 'beast-warrior-primal-roar',
      slot: 'ultimate',
      name: 'Primal Roar',
      description: 'Area roar that knocks enemies away and bleeds them.',
      cooldownMs: 5200,
    },
  },
};
