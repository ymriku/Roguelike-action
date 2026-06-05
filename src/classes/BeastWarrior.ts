import { ClassDefinition } from './ClassDefinition';

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
};
