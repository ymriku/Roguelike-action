import { ClassDefinition } from './ClassDefinition';

export const Machinist: ClassDefinition = {
  id: 'machinist',
  name: 'Machinist',
  description: 'Ranged fighter using a rifle, grenades, rapid fire, and rocket explosives.',
  maxHp: 90,
  moveSpeed: 240,
  jumpPower: 500,
  skills: {
    skill1: {
      id: 'machinist-frag-grenade',
      slot: 'skill1',
      name: 'Frag Grenade',
      description: 'Throws an arcing grenade that explodes in an area.',
      cooldownMs: 1200,
    },
    skill2: {
      id: 'machinist-rapid-fire',
      slot: 'skill2',
      name: 'Rapid Fire',
      description: 'Fires a short burst of rifle rounds.',
      cooldownMs: 2100,
    },
    ultimate: {
      id: 'machinist-rocket-launcher',
      slot: 'ultimate',
      name: 'Rocket Launcher',
      description: 'Launches a heavy rocket with a large explosion.',
      cooldownMs: 5000,
    },
  },
};
