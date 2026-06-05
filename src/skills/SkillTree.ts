import { PlayerClassId } from '../classes';
import { SaveSystem } from '../systems/SaveSystem';

export type SkillNode = {
  id: string;
  name: string;
  cost: number;
  description?: string;
  children?: string[];
};

export type SkillTree = Record<string, SkillNode>;

export const SamuraiSkillTree: SkillTree = {
  iaigiri: { id: 'iaigiri', name: '居合強化', cost: 2, description: '居合の威力が上がる', children: ['counterBoost'] },
  counterBoost: { id: 'counterBoost', name: 'カウンターブースト', cost: 3, description: 'カウンター成功でバフを得る' },
};

export const BeastSkillTree: SkillTree = {
  frenzy: { id: 'frenzy', name: '狂乱', cost: 2, description: '攻撃速度と移動速度が上がる短時間バフ' , children: ['rendClaw']},
  rendClaw: { id: 'rendClaw', name: '裂爪', cost: 2, description: '前方に2連斬りを行い、出血を与える' , children: ['beastRoar']},
  beastRoar: { id: 'beastRoar', name: '獣の咆哮', cost: 3, description: '範囲内の敵を短時間スタンさせる' },
};

export const PyromancerSkillTree: SkillTree = {
  fireBolt: { id: 'fireBolt', name: 'ファイアボルト', cost: 1, description: '直線射撃し小範囲で爆発する' , children: ['flamePillar']},
  flamePillar: { id: 'flamePillar', name: 'フレイムピラー', cost: 3, description: '指定地点に炎の柱を発生させる（DoT）' , children: ['flameShield']},
  flameShield: { id: 'flameShield', name: '爆炎の盾', cost: 4, description: '一定時間接触した敵に炎ダメージを与えるバリア' },
};

export const FrostLancerSkillTree: SkillTree = {
  iceLance: { id: 'iceLance', name: 'アイスランス', cost: 1, description: '貫通する氷槍を射出しスローを付与' , children: ['frostStep']},
  frostStep: { id: 'frostStep', name: 'フロストステップ', cost: 2, description: '無敵で後方へ移動する回避技' , children: ['freezeThrust']},
  freezeThrust: { id: 'freezeThrust', name: '氷結突き', cost: 3, description: '近距離で当てると1秒凍結させる' },
};

export const DragonbloodSkillTree: SkillTree = {
  dragonSmash: { id: 'dragonSmash', name: 'ドラゴンスマッシュ', cost: 2, description: '大剣を叩きつけ衝撃波を発生' , children: ['dragonbloodRelease']},
  dragonbloodRelease: { id: 'dragonbloodRelease', name: '竜血解放', cost: 4, description: '攻撃力を上げ炎属性を付与する' , children: ['dragonCharge']},
  dragonCharge: { id: 'dragonCharge', name: 'ドラゴンチャージ', cost: 2, description: '高速突進でノックバックを与える' },
};

export const WindDancerSkillTree: SkillTree = {
  airDance: { id: 'airDance', name: 'エアダンス', cost: 2, description: '空中で方向転換しながら斬撃を行う', children: ['windCutter'] },
  windCutter: { id: 'windCutter', name: '風刃', cost: 2, description: '斬撃を飛ばす遠距離技', children: ['galeStep'] },
  galeStep: { id: 'galeStep', name: '疾風回避', cost: 1, description: '短めクールの無敵回避' },
};

export const MachinistSkillTree: SkillTree = {
  turret: { id: 'turret', name: 'タレット設置', cost: 2, description: '自動射撃タレットを設置する' , children: ['mine']},
  mine: { id: 'mine', name: '地雷', cost: 1, description: '踏むと爆発する地雷を設置' , children: ['overdrive']},
  overdrive: { id: 'overdrive', name: 'オーバードライブ', cost: 4, description: '一定時間攻撃速度が上がる' },
};

export const SkillTrees: Record<PlayerClassId, SkillTree> = {
  'beast-warrior': BeastSkillTree,
  'dragoonblood-knight': DragonbloodSkillTree,
  'frost-lancer': FrostLancerSkillTree,
  machinist: MachinistSkillTree,
  pyromancer: PyromancerSkillTree,
  samurai: SamuraiSkillTree,
};

export const getPurchasedSkills = (classId: PlayerClassId): string[] => {
  return SaveSystem.getPurchasedSkills(classId);
};

export const isSkillPurchased = (classId: PlayerClassId, skillId: string): boolean => {
  return getPurchasedSkills(classId).includes(skillId);
};

export const unlockSkill = (classId: PlayerClassId, skillId: string): boolean => {
  return SaveSystem.unlockSkill(classId, skillId);
};

export const getSkillPrerequisite = (classId: PlayerClassId, skillId: string): SkillNode | undefined => {
  const tree = SkillTrees[classId];
  if (!tree) return undefined;
  return Object.values(tree).find((skill) => skill.children?.includes(skillId));
};

export const canUnlockSkill = (classId: PlayerClassId, skillId: string): boolean => {
  const prereq = getSkillPrerequisite(classId, skillId);
  if (!prereq) return true;
  return isSkillPurchased(classId, prereq.id);
};
