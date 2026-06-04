# Stage Generation

## Goal

ローグライクらしい変化を出しつつ、横スクロールアクションとして破綻しない足場構造を生成する。生成結果は必ず開始地点からゴールまで到達可能にする。

## Stage Structure

- Segment: 横方向に並ぶ生成単位
- Room: 戦闘、報酬、イベントなどの目的を持つ区間
- Connector: 部屋同士をつなぐ足場または通路
- Encounter: 敵配置と報酬条件
- Exit: 次階層への到達点

## Generation Flow

1. ランのシード値を決める。
2. ステージ長と部屋数を決める。
3. 部屋タイプを重み付き抽選する。
4. 各部屋の足場テンプレートを配置する。
5. 部屋間をジャンプ可能な距離で接続する。
6. 敵、罠、宝箱、回復を配置する。
7. 到達可能性チェックを行う。

## Constraints

- 最大ジャンプ距離と二段ジャンプ距離から足場間隔を決める。
- ダッシュ必須の地形は序盤では避ける。
- ゴールまでの主経路には詰みになる落下穴を置かない。
- ランダム性はシードで再現できるようにする。

## Phase3 Data Draft

```ts
type StageSegment = {
  x: number;
  width: number;
  type: 'combat' | 'reward' | 'event' | 'rest' | 'boss';
  platforms: PlatformDefinition[];
  encounters: EncounterDefinition[];
};
```

## Debug Needs

- 生成シードの画面表示
- 足場到達判定の可視化
- 部屋タイプと敵配置のログ出力
- 固定シードでのリプレイ
