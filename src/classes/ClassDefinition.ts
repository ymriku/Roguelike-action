<<<<<<< HEAD
// クラスの共通設計（すべての職業のベース）

export type ClassId =
  | 'samurai'
  | 'ninja'
  | 'archer'
  | 'summoner'
  | 'priest'
  | 'dragoon'
  | 'beast'
  | 'pyromancer'
  | 'frostlancer'
  | 'dragonblood'
  | 'winddancer'
  | 'machinist';

export interface ClassDefinition {
  id: ClassId;
  name: string;

  // 基本ステータス
  hp: number;
  attack: number;
  speed: number;

  // 攻撃設定
  attackCooldown: number;
  attackType: 'melee' | 'ranged';
  projectileSpeed?: number;

  // 見た目 / 画像キー
  spriteKey?: string;
  attackSpriteKey?: string;
  projectileSpriteKey?: string;
  specialSpriteKey?: string;

  // 移動と回避
  maxJumpCount?: number;
  dashCooldown?: number;

  // 特殊スキル
  canCounter: boolean;
  specialName: string;
  specialDescription: string;
}
=======
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
>>>>>>> f2a20ba (Add class and input systems)
