export type WeaponKind = 'melee' | 'ranged' | 'magic' | 'gadget' | 'unarmed';

export type Weapon = {
  id: string;
  name: string;
  kind: WeaponKind;
  damage: number;
  cooldown: number; // ms
  range?: number;
  projectileSpeed?: number;
  description?: string;
};

export const Weapons: Record<string, Weapon> = {
  beastClaws: {
    id: 'beastClaws',
    name: '爪・牙',
    kind: 'unarmed',
    damage: 26,
    cooldown: 220,
    range: 40,
    description: '素早い近接攻撃。出血効果を持つ技と相性が良い。',
  },
  pyromancerTome: {
    id: 'pyromancerTome',
    name: '魔導書・火球',
    kind: 'magic',
    damage: 18,
    cooldown: 360,
    range: 420,
    projectileSpeed: 520,
    description: '火の魔術を使うための魔導書。範囲攻撃に強い。',
  },
  frostLance: {
    id: 'frostLance',
    name: '氷の槍',
    kind: 'ranged',
    damage: 22,
    cooldown: 300,
    range: 520,
    projectileSpeed: 600,
    description: '貫通する氷の槍で敵を遅くする。',
  },
  dragonGreatsword: {
    id: 'dragonGreatsword',
    name: '大剣',
    kind: 'melee',
    damage: 36,
    cooldown: 420,
    range: 64,
    description: '重い大剣。衝撃波を発生させる技と相性が良い。',
  },
  windDaggers: {
    id: 'windDaggers',
    name: '双短剣',
    kind: 'melee',
    damage: 16,
    cooldown: 180,
    range: 36,
    description: '高速連撃が得意な短剣。空中コンボに向く。',
  },
  machinistRifle: {
    id: 'machinistRifle',
    name: '銃・ガジェット',
    kind: 'ranged',
    damage: 14,
    cooldown: 200,
    range: 680,
    projectileSpeed: 560,
    description: '遠距離から安全に攻撃できるガジェット武器。',
  },
};
