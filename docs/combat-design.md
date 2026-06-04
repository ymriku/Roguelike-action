# Combat Design

## Combat Goals

戦闘は横スクロールアクションとして、敵の攻撃予兆を見て避け、隙に攻撃を差し込む構造にする。ダッシュ回避は強いが連発できず、ジャンプと足場移動も防御手段として機能させる。

## Core Elements

- HP: プレイヤーと敵の耐久値
- Damage: 攻撃ごとの基礎ダメージ
- Hitbox: 攻撃判定
- Hurtbox: 被弾判定
- Knockback: 被弾時の押し戻し
- Invulnerability: ダッシュや被弾後の短時間無敵
- Telegraph: 敵攻撃の予兆

## Player Actions

- Basic Attack: 地上と空中で使える標準攻撃
- Skill: クールダウン付きのクラス固有行動
- Dash: 短距離移動と一時的な無敵
- Jump / Double Jump: 攻撃回避と位置調整

## Enemy Draft

- Chaser: プレイヤーへ近づき接触攻撃する
- Shooter: 距離を取りながら弾を撃つ
- Guard: 正面に強く、背後からの攻撃に弱い
- Boss: 複数フェーズと明確な攻撃予兆を持つ

## Phase2 Implementation Plan

1. プレイヤーHPと敵HPを追加する。
2. 仮の近接攻撃判定を追加する。
3. 敵の仮スプライトと単純AIを追加する。
4. ダメージ、ノックバック、被弾無敵を実装する。
5. デバッグ表示で判定を確認する。
