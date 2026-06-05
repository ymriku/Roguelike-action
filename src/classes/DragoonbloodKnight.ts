import { ClassDefinition } from './ClassDefinition';

export const DragoonbloodKnight: ClassDefinition = {
  id: 'dragoonblood-knight',
  name: 'Dragoonblood Knight',
  maxHp: 115,
  moveSpeed: 235,
  jumpPower: 560,
  skills: {
    skill1: {
      id: 'dragoonblood-knight-drake-thrust',
      slot: 'skill1',
      name: 'Drake Thrust',
      description: 'Heavy lance thrust with strong horizontal knockback.',
      cooldownMs: 300,
    },
    skill2: {
      id: 'dragoonblood-knight-wyvern-ascent',
      slot: 'skill2',
      name: 'Wyvern Ascent',
      description: 'Charged rising strike for aerial positioning.',
      cooldownMs: 2500,
    },
    ultimate: {
      id: 'dragoonblood-knight-bloodwing-guard',
      slot: 'ultimate',
      name: 'Bloodwing Guard',
      description: 'Guard stance that retaliates with a wing slash.',
      cooldownMs: 5600,
    },
  },
};
