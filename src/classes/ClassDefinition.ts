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