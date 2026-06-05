import { BeastWarrior } from './BeastWarrior';
import { ClassDefinition, PlayerClassId } from './ClassDefinition';
import { DragoonbloodKnight } from './DragoonbloodKnight';
import { FrostLancer } from './FrostLancer';
import { Machinist } from './Machinist';
import { Pyromancer } from './Pyromancer';
import { Samurai } from './Samurai';

export const CLASS_DEFINITIONS: Record<PlayerClassId, ClassDefinition> = {
  'beast-warrior': BeastWarrior,
  'dragoonblood-knight': DragoonbloodKnight,
  'frost-lancer': FrostLancer,
  machinist: Machinist,
  pyromancer: Pyromancer,
  samurai: Samurai,
};

export const DEFAULT_CLASS_ID: PlayerClassId = 'samurai';
export const classMap = CLASS_DEFINITIONS;
export const classList = Object.values(CLASS_DEFINITIONS);

export function getClassDefinition(classId: PlayerClassId = DEFAULT_CLASS_ID): ClassDefinition {
  return CLASS_DEFINITIONS[classId];
}

export { BeastWarrior } from './BeastWarrior';
export { DragoonbloodKnight } from './DragoonbloodKnight';
export { FrostLancer } from './FrostLancer';
export { Machinist } from './Machinist';
export { Pyromancer } from './Pyromancer';
export { Samurai } from './Samurai';
export type { ClassDefinition, ClassSkillDefinition, ClassSkillSlot, PlayerClassId } from './ClassDefinition';
