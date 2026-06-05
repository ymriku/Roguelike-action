export type { ClassDefinition } from './ClassDefinition';
import { ClassDefinition } from './ClassDefinition';
import { SamuraiClass } from './Samurai';
import { BeastClass } from './BeastWarrior';
import { PyromancerClass } from './Pyromancer';
import { FrostLancerClass } from './FrostLancer';
import { DragonbloodClass } from './DragonbloodKnight';
import { WindDancerClass } from './WindDancer';
import { MachinistClass } from './Machinist';

export const NinjaClass: ClassDefinition = {
  id: 'ninja',
  name: '忍者',
  hp: 92,
  attack: 18,
  speed: 1.28,
  attackCooldown: 260,
  canCounter: false,
  attackType: 'melee',
  maxJumpCount: 3,
  dashCooldown: 320,
  spriteKey: 'player-ninja',
  attackSpriteKey: 'weapon-ninja',
  specialSpriteKey: 'special-ninja',
  specialName: '影遁',
  specialDescription: '素早い移動と多段ジャンプで戦場を翻弄する。',
};

export const ArcherClass: ClassDefinition = {
  id: 'archer',
  name: '弓使い',
  hp: 88,
  attack: 16,
  speed: 1.0,
  attackCooldown: 320,
  canCounter: false,
  attackType: 'ranged',
  projectileSpeed: 520,
  spriteKey: 'player-archer',
  attackSpriteKey: 'weapon-bow',
  projectileSpriteKey: 'projectile-arrow',
  specialSpriteKey: 'special-arrow',
  specialName: '貫通矢',
  specialDescription: '遠距離から安全に攻撃できる。',
};

export const SummonerClass: ClassDefinition = {
  id: 'summoner',
  name: '召喚士',
  hp: 104,
  attack: 14,
  speed: 0.94,
  attackCooldown: 420,
  canCounter: false,
  attackType: 'ranged',
  projectileSpeed: 460,
  spriteKey: 'player-summoner',
  attackSpriteKey: 'weapon-staff',
  projectileSpriteKey: 'projectile-spirit',
  specialSpriteKey: 'special-summon',
  specialName: '使い魔召喚',
  specialDescription: '使い魔を呼び出し、戦線を補助する。',
};

export const PriestClass: ClassDefinition = {
  id: 'priest',
  name: 'プリースト',
  hp: 112,
  attack: 12,
  speed: 0.92,
  attackCooldown: 420,
  canCounter: false,
  attackType: 'ranged',
  projectileSpeed: 420,
  spriteKey: 'player-priest',
  attackSpriteKey: 'weapon-priest',
  projectileSpriteKey: 'projectile-light',
  specialSpriteKey: 'special-heal',
  specialName: '癒しの光',
  specialDescription: '回復と攻撃を両立する支援型戦闘。',
};

export const DragoonClass: ClassDefinition = {
  id: 'dragoon',
  name: 'ドラグーン',
  hp: 128,
  attack: 22,
  speed: 1.06,
  attackCooldown: 360,
  canCounter: false,
  attackType: 'melee',
  maxJumpCount: 3,
  dashCooldown: 360,
  spriteKey: 'player-dragoon',
  attackSpriteKey: 'weapon-spear',
  specialSpriteKey: 'special-spear',
  specialName: '槍ジャンプ',
  specialDescription: '空中から強力な一撃を叩き込む。',
};

export const classList: ClassDefinition[] = [
  SamuraiClass,
  NinjaClass,
  ArcherClass,
  SummonerClass,
  PriestClass,
  DragoonClass,
  BeastClass,
  PyromancerClass,
  FrostLancerClass,
  DragonbloodClass,
  WindDancerClass,
  MachinistClass,
];

export const classMap: Record<ClassDefinition['id'], ClassDefinition> = {
  samurai: SamuraiClass,
  ninja: NinjaClass,
  archer: ArcherClass,
  summoner: SummonerClass,
  priest: PriestClass,
  dragoon: DragoonClass,
  beast: BeastClass,
  pyromancer: PyromancerClass,
  frostlancer: FrostLancerClass,
  dragonblood: DragonbloodClass,
  winddancer: WindDancerClass,
  machinist: MachinistClass,
};
