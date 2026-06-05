// クラスの共通設計（すべての職業のベース）

export type ClassId = "samurai";

export interface ClassDefinition {
  id: ClassId;
  name: string;

  // 基本ステータス
  hp: number;
  attack: number;
  speed: number;

  // 攻撃設定
  attackCooldown: number;

  // 特殊スキル
  canCounter: boolean;
}