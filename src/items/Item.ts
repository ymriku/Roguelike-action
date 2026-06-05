export type ItemKind = 'consumable' | 'artifact';

export type Item = {
  id: string;
  name: string;
  kind: ItemKind;
  description?: string;
  iconKey?: string;
};

export const Items: Record<string, Item> = {
  potion: {
    id: 'potion',
    name: '回復薬',
    kind: 'consumable',
    description: 'HPを回復する。',
    iconKey: 'item-potion',
  },
  speedTonic: {
    id: 'speedTonic',
    name: '疾走の秘薬',
    kind: 'consumable',
    description: 'しばらく移動速度が上がる。',
    iconKey: 'item-speedTonic',
  },
  strengthElixir: {
    id: 'strengthElixir',
    name: '力の秘薬',
    kind: 'consumable',
    description: '攻撃力がわずかに上がる。',
    iconKey: 'item-strengthElixir',
  },
  minorArtifact: {
    id: 'minorArtifact',
    name: '古びた護符',
    kind: 'artifact',
    description: '最大HPがわずかに上昇する。',
    iconKey: 'item-minorArtifact',
  },
  rareArtifact: {
    id: 'rareArtifact',
    name: '聖なる蒼玉',
    kind: 'artifact',
    description: '最大HPと攻撃力が大きく上がる。',
    iconKey: 'item-rareArtifact',
  },
};
