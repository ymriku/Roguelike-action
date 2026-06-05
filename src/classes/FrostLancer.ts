import { ClassDefinition } from './ClassDefinition';

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
};
