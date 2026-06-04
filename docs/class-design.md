# Class Design

## Purpose

プレイヤークラスは操作感、攻撃範囲、リスク管理方法を変えるための軸にする。Phase1ではクラス選択は未実装だが、将来の拡張に備えて移動、戦闘、成長を分離して設計する。

## Planned Classes

## Vanguard

- 役割: 近接標準クラス
- 特徴: 扱いやすい剣攻撃、短い無敵ダッシュ、安定したHP
- 弱点: 遠距離対応が弱い

## Duelist

- 役割: 高機動近接クラス
- 特徴: 連続ダッシュ、背後攻撃ボーナス、クリティカル
- 弱点: HPが低い

## Arcanist

- 役割: 中距離スキルクラス
- 特徴: 魔法弾、設置攻撃、属性効果
- 弱点: 攻撃前後の隙が大きい

## Data Model Draft

```ts
type PlayerClassDefinition = {
  id: string;
  displayName: string;
  maxHp: number;
  moveSpeed: number;
  jumpPower: number;
  dashCooldownMs: number;
  startingWeaponId: string;
  skillIds: string[];
};
```

## Implementation Notes

- 移動性能は `Player` へ直接固定せず、将来はクラス定義から注入する。
- 攻撃、スキル、パッシブは個別システムとして分離する。
- クラス固有処理は条件分岐の肥大化を避け、能力コンポーネントとして追加する。
