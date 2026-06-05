import { DEFAULT_CLASS_ID, PlayerClassId, classList } from '../classes';

export const SAVE_VERSION = 1;

const SAVE_KEY = 'roguelike_action_save_v1';
const LEGACY_SKILL_PURCHASE_KEY = 'roguelike_skill_state_v1';

export type SaveSettings = {
  mobileControls: boolean;
  sfxVolume: number;
  musicVolume: number;
};

export type SaveData = {
  version: number;
  selectedClassId: PlayerClassId;
  unlockedClassIds: PlayerClassId[];
  skillTreeProgress: Partial<Record<PlayerClassId, string[]>>;
  settings: SaveSettings;
};

const DEFAULT_SETTINGS: SaveSettings = {
  mobileControls: true,
  sfxVolume: 1,
  musicVolume: 1,
};

function getDefaultUnlockedClassIds(): PlayerClassId[] {
  return classList.map((classDef) => classDef.id);
}

function createDefaultSave(): SaveData {
  return {
    version: SAVE_VERSION,
    selectedClassId: DEFAULT_CLASS_ID,
    unlockedClassIds: getDefaultUnlockedClassIds(),
    skillTreeProgress: {},
    settings: { ...DEFAULT_SETTINGS },
  };
}

function canUseLocalStorage(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
}

function normalizeClassIds(classIds: unknown): PlayerClassId[] {
  if (!Array.isArray(classIds)) {
    return getDefaultUnlockedClassIds();
  }

  const validIds = new Set(classList.map((classDef) => classDef.id));
  const normalized = classIds.filter((classId): classId is PlayerClassId => (
    typeof classId === 'string' && validIds.has(classId as PlayerClassId)
  ));

  return normalized.length > 0 ? normalized : getDefaultUnlockedClassIds();
}

function normalizeSaveData(raw: unknown): SaveData {
  const defaults = createDefaultSave();
  if (!raw || typeof raw !== 'object') {
    return defaults;
  }

  const partial = raw as Partial<SaveData>;
  const unlockedClassIds = normalizeClassIds(partial.unlockedClassIds);
  const selectedClassId = unlockedClassIds.includes(partial.selectedClassId as PlayerClassId)
    ? partial.selectedClassId as PlayerClassId
    : defaults.selectedClassId;

  return {
    version: typeof partial.version === 'number' ? partial.version : SAVE_VERSION,
    selectedClassId,
    unlockedClassIds,
    skillTreeProgress: partial.skillTreeProgress && typeof partial.skillTreeProgress === 'object'
      ? partial.skillTreeProgress
      : {},
    settings: {
      ...DEFAULT_SETTINGS,
      ...(partial.settings && typeof partial.settings === 'object' ? partial.settings : {}),
    },
  };
}

export class SaveSystem {
  static load(): SaveData {
    if (!canUseLocalStorage()) {
      return createDefaultSave();
    }

    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) {
      const initialSave = createDefaultSave();
      SaveSystem.save(initialSave);
      return initialSave;
    }

    try {
      const saveData = normalizeSaveData(JSON.parse(raw));
      if (saveData.version !== SAVE_VERSION) {
        saveData.version = SAVE_VERSION;
        SaveSystem.save(saveData);
      }
      return saveData;
    } catch {
      const fallbackSave = createDefaultSave();
      SaveSystem.save(fallbackSave);
      return fallbackSave;
    }
  }

  static save(saveData: SaveData): void {
    if (!canUseLocalStorage()) {
      return;
    }

    window.localStorage.setItem(SAVE_KEY, JSON.stringify({
      ...saveData,
      version: SAVE_VERSION,
    }));
  }

  static getSelectedClassId(): PlayerClassId {
    return SaveSystem.load().selectedClassId;
  }

  static setSelectedClassId(classId: PlayerClassId): void {
    const saveData = SaveSystem.load();
    saveData.selectedClassId = classId;
    if (!saveData.unlockedClassIds.includes(classId)) {
      saveData.unlockedClassIds.push(classId);
    }
    SaveSystem.save(saveData);
  }

  static getUnlockedClassIds(): PlayerClassId[] {
    return SaveSystem.load().unlockedClassIds;
  }

  static isClassUnlocked(classId: PlayerClassId): boolean {
    return SaveSystem.getUnlockedClassIds().includes(classId);
  }

  static unlockClass(classId: PlayerClassId): void {
    const saveData = SaveSystem.load();
    if (!saveData.unlockedClassIds.includes(classId)) {
      saveData.unlockedClassIds.push(classId);
      SaveSystem.save(saveData);
    }
  }

  static getPurchasedSkills(classId: PlayerClassId): string[] {
    const saveData = SaveSystem.load();
    const purchased = saveData.skillTreeProgress[classId];
    if (purchased) {
      return purchased;
    }

    const legacy = canUseLocalStorage()
      ? window.localStorage.getItem(`${LEGACY_SKILL_PURCHASE_KEY}_${classId}`)
      : null;
    const migrated = legacy ? legacy.split(',').filter(Boolean) : [];
    if (migrated.length > 0) {
      saveData.skillTreeProgress[classId] = migrated;
      SaveSystem.save(saveData);
    }

    return migrated;
  }

  static setPurchasedSkills(classId: PlayerClassId, skillIds: string[]): void {
    const saveData = SaveSystem.load();
    saveData.skillTreeProgress[classId] = Array.from(new Set(skillIds));
    SaveSystem.save(saveData);
  }

  static unlockSkill(classId: PlayerClassId, skillId: string): boolean {
    const purchased = new Set(SaveSystem.getPurchasedSkills(classId));
    if (purchased.has(skillId)) {
      return false;
    }

    purchased.add(skillId);
    SaveSystem.setPurchasedSkills(classId, Array.from(purchased));
    return true;
  }

  static getSettings(): SaveSettings {
    return SaveSystem.load().settings;
  }

  static updateSettings(settings: Partial<SaveSettings>): void {
    const saveData = SaveSystem.load();
    saveData.settings = {
      ...saveData.settings,
      ...settings,
    };
    SaveSystem.save(saveData);
  }
}
