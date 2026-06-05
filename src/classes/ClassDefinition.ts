export type PlayerClassId =
  | 'beast-warrior'
  | 'dragoonblood-knight'
  | 'frost-lancer'
  | 'machinist'
  | 'pyromancer'
  | 'samurai';

export type ClassSkillSlot = 'skill1' | 'skill2' | 'ultimate';

export type ClassSkillDefinition = {
  id: string;
  slot: ClassSkillSlot;
  name: string;
  description: string;
  cooldownMs: number;
};

export type ClassDefinition = {
  id: PlayerClassId;
  name: string;
  maxHp: number;
  moveSpeed: number;
  jumpPower: number;
  skills: Record<ClassSkillSlot, ClassSkillDefinition>;
};
