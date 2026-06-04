export type PlatformDefinition = {
  x: number;
  y: number;
  width: number;
  height: number;
  color: number;
  kind: 'ground' | 'ledge';
};

export type PointDefinition = {
  x: number;
  y: number;
};

export type StageDifficulty = {
  segmentCount: number;
  enemyCount: number;
  maxGap: number;
  heightVariance: number;
};

export type GeneratedStage = {
  runSeed: string;
  stageSeed: number;
  stageIndex: number;
  worldWidth: number;
  worldHeight: number;
  start: PointDefinition;
  goal: PointDefinition;
  platforms: PlatformDefinition[];
  slimeSpawns: PointDefinition[];
  difficulty: StageDifficulty;
};

const WORLD_HEIGHT = 720;
const SEGMENT_MIN_WIDTH = 360;
const SEGMENT_MAX_WIDTH = 520;
const PLATFORM_HEIGHT = 48;
const LEDGE_HEIGHT = 30;

type RandomSource = {
  next: () => number;
  int: (min: number, max: number) => number;
  pick: <T>(items: T[]) => T;
};

export function createRunSeed(): string {
  return Math.floor(Math.random() * 0xffffffff)
    .toString(36)
    .padStart(7, '0');
}

export function readSeedFromLocation(location: Location): string | undefined {
  const seed = new URLSearchParams(location.search).get('seed')?.trim();

  return seed || undefined;
}

export function generateStage(stageIndex: number, runSeed: string): GeneratedStage {
  const normalizedStageIndex = Math.max(1, Math.floor(stageIndex));
  const stageSeed = hashSeed(`${runSeed}:stage:${normalizedStageIndex}`);
  const random = createRandomSource(stageSeed);
  const difficulty = createDifficulty(normalizedStageIndex);
  const platforms: PlatformDefinition[] = [];
  let cursorX = 120;
  let lastTopY = WORLD_HEIGHT - 72;

  for (let index = 0; index < difficulty.segmentCount; index += 1) {
    const width = random.int(SEGMENT_MIN_WIDTH, SEGMENT_MAX_WIDTH);
    const gap = index === 0 ? 0 : random.int(44, difficulty.maxGap);
    const targetTopY =
      index === 0
        ? WORLD_HEIGHT - 72
        : PhaserMathClamp(
            lastTopY + random.int(-difficulty.heightVariance, difficulty.heightVariance),
            WORLD_HEIGHT - 168,
            WORLD_HEIGHT - 56,
          );
    const platformX = cursorX + gap + width / 2;

    platforms.push({
      x: platformX,
      y: targetTopY + PLATFORM_HEIGHT / 2,
      width,
      height: PLATFORM_HEIGHT,
      color: random.pick([0x283546, 0x2e4155, 0x334756]),
      kind: 'ground',
    });

    if (index > 0 && index < difficulty.segmentCount - 1 && random.next() < 0.55) {
      platforms.push(createLedge(platformX, targetTopY, width, random));
    }

    cursorX = platformX + width / 2;
    lastTopY = targetTopY;
  }

  const groundPlatforms = platforms.filter((platform) => platform.kind === 'ground');
  const firstPlatform = groundPlatforms[0];
  const lastPlatform = groundPlatforms[groundPlatforms.length - 1];
  const worldWidth = Math.ceil(lastPlatform.x + lastPlatform.width / 2 + 260);
  const start = {
    x: firstPlatform.x - firstPlatform.width / 2 + 96,
    y: firstPlatform.y - firstPlatform.height / 2 - 28,
  };
  const goal = {
    x: lastPlatform.x + lastPlatform.width / 2 - 80,
    y: lastPlatform.y - lastPlatform.height / 2 - 36,
  };

  return {
    runSeed,
    stageSeed,
    stageIndex: normalizedStageIndex,
    worldWidth,
    worldHeight: WORLD_HEIGHT,
    start,
    goal,
    platforms,
    slimeSpawns: createSlimeSpawns(groundPlatforms, difficulty.enemyCount, random),
    difficulty,
  };
}

function createDifficulty(stageIndex: number): StageDifficulty {
  return {
    segmentCount: Math.min(8 + Math.floor(stageIndex * 1.5), 18),
    enemyCount: Math.min(3 + stageIndex * 2, 30),
    maxGap: Math.min(72 + stageIndex * 8, 150),
    heightVariance: Math.min(24 + stageIndex * 5, 76),
  };
}

function createLedge(
  platformX: number,
  groundTopY: number,
  groundWidth: number,
  random: RandomSource,
): PlatformDefinition {
  const width = random.int(130, Math.min(260, Math.floor(groundWidth * 0.72)));
  const offsetX = random.int(-Math.floor(groundWidth * 0.24), Math.floor(groundWidth * 0.24));

  return {
    x: platformX + offsetX,
    y: groundTopY - random.int(96, 148),
    width,
    height: LEDGE_HEIGHT,
    color: random.pick([0x3d5266, 0x435d72, 0x496779]),
    kind: 'ledge',
  };
}

function createSlimeSpawns(
  groundPlatforms: PlatformDefinition[],
  enemyCount: number,
  random: RandomSource,
): PointDefinition[] {
  const spawnablePlatforms = groundPlatforms.slice(1, -1);
  const spawns: PointDefinition[] = [];

  if (spawnablePlatforms.length === 0) {
    return spawns;
  }

  for (let index = 0; index < enemyCount; index += 1) {
    const platform = spawnablePlatforms[index % spawnablePlatforms.length];
    const lane = Math.floor(index / spawnablePlatforms.length);
    const left = platform.x - platform.width / 2 + 54;
    const right = platform.x + platform.width / 2 - 54;
    const laneOffset = lane * 34;
    const x = PhaserMathClamp(random.int(Math.floor(left), Math.floor(right)) + laneOffset, left, right);

    spawns.push({
      x,
      y: platform.y - platform.height / 2 - 24,
    });
  }

  return spawns;
}

function createRandomSource(seed: number): RandomSource {
  let state = seed >>> 0;

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    int: (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min,
    pick: <T>(items: T[]) => items[Math.floor(next() * items.length)],
  };
}

function hashSeed(seed: string): number {
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function PhaserMathClamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
