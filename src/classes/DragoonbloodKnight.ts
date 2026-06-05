import { ClassDefinition } from './ClassDefinition';

export const DragoonbloodKnight: ClassDefinition = {
  id: 'dragoonblood-knight',
  name: 'Dragoonblood Knight',
  description: 'Heavy aerial knight using lance reach, strong knockback, and dragon-blood guard timing.',
  maxHp: 115,
  moveSpeed: 235,
  jumpPower: 560,
  skills: {
    skill1: {
      id: 'dragoonblood-knight-drake-thrust',
      slot: 'skill1',
      name: 'Drake Thrust',
      description: 'Forward lance charge with strong horizontal knockback.',
      cooldownMs: 1000,
    },
    skill2: {
      id: 'dragoonblood-knight-wyvern-ascent',
      slot: 'skill2',
      name: 'Wyvern Ascent',
      description: 'Jump attack that rises, then crashes down with a lance hit.',
      cooldownMs: 2500,
    },
    ultimate: {
      id: 'dragoonblood-knight-dragonfall',
      slot: 'ultimate',
      name: 'Dragonfall',
      description: 'High leap into a heavy descending impact.',
      cooldownMs: 5600,
    },
  },
};
