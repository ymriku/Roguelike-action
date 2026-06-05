import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { deflateSync } from 'node:zlib';

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

const classes = {
  samurai: { armor: [16, 20, 29], cloth: [38, 45, 59], trim: [210, 214, 222], accent: [126, 211, 255], weapon: 'katana', mask: true },
  ninja: { armor: [11, 14, 20], cloth: [30, 36, 50], trim: [220, 225, 232], accent: [91, 141, 239], weapon: 'katana', mask: true },
  'beast-warrior': { armor: [38, 33, 28], cloth: [76, 116, 72], trim: [229, 214, 177], accent: [151, 95, 64], weapon: 'claws', mask: false },
  'dragoonblood-knight': { armor: [42, 31, 62], cloth: [111, 30, 44], trim: [231, 117, 68], accent: [170, 50, 62], weapon: 'greatsword', mask: false },
  'frost-lancer': { armor: [28, 45, 67], cloth: [86, 148, 194], trim: [224, 244, 255], accent: [137, 211, 255], weapon: 'lance', mask: false },
  machinist: { armor: [43, 52, 64], cloth: [132, 112, 53], trim: [171, 184, 198], accent: [230, 183, 84], weapon: 'rifle', mask: false },
  pyromancer: { armor: [43, 30, 58], cloth: [134, 44, 50], trim: [252, 185, 112], accent: [255, 99, 72], weapon: 'staff', mask: false },
};

const animations = {
  idle: 4,
  run: 6,
  attack: 6,
  dash: 4,
};

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function createCanvas(width, height) {
  const pixels = new Uint8Array(width * height * 4);
  return {
    width,
    height,
    pixels,
    set(x, y, color) {
      if (x < 0 || y < 0 || x >= width || y >= height) return;
      const index = (Math.floor(y) * width + Math.floor(x)) * 4;
      pixels[index] = color[0];
      pixels[index + 1] = color[1];
      pixels[index + 2] = color[2];
      pixels[index + 3] = color[3] ?? 255;
    },
    rect(x, y, w, h, color) {
      for (let yy = y; yy < y + h; yy += 1) {
        for (let xx = x; xx < x + w; xx += 1) this.set(xx, yy, color);
      }
    },
    line(x0, y0, x1, y1, color) {
      const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
      for (let i = 0; i <= steps; i += 1) {
        const t = steps === 0 ? 0 : i / steps;
        this.set(Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t), color);
      }
    },
  };
}

function savePng(path, canvas) {
  const { width, height, pixels } = canvas;
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const row = y * (width * 4 + 1);
    raw[row] = 0;
    raw.set(pixels.subarray(y * width * 4, (y + 1) * width * 4), row + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, png);
}

function drawCharacter(canvas, x, frame, animation, style, options = {}) {
  const bob = animation === 'run' ? (frame % 2 === 0 ? 1 : -1) : animation === 'dash' ? -1 : frame % 2;
  const lean = animation === 'dash' ? 4 : animation === 'attack' ? 3 : 0;
  const skin = [226, 176, 138, 255];
  const shadow = [5, 8, 13, options.shadowAlpha ?? 255];
  const armor = [...style.armor, 255];
  const cloth = [...style.cloth, 255];
  const trim = [...style.trim, 255];
  const accent = [...style.accent, 255];

  canvas.rect(x + 11 + lean, 4 + bob, 10, 9, armor);
  canvas.rect(x + 13 + lean, 7 + bob, 7, 3, skin);
  if (style.mask) {
    canvas.rect(x + 11 + lean, 4 + bob, 11, 4, shadow);
    canvas.rect(x + 11 + lean, 10 + bob, 11, 4, shadow);
    canvas.rect(x + 15 + lean, 8 + bob, 5, 2, skin);
    canvas.rect(x + 19 + lean, 8 + bob, 2, 1, accent);
  } else {
    canvas.rect(x + 12 + lean, 4 + bob, 9, 2, shadow);
  }

  canvas.rect(x + 10 + lean, 13 + bob, 13, 10, armor);
  canvas.rect(x + 12 + lean, 17 + bob, 12, 5, cloth);
  canvas.rect(x + 9 + lean, 14 + bob, 3, 8, shadow);
  canvas.rect(x + 22 + lean, 14 + bob, 3, 8, trim);
  canvas.rect(x + 13 + lean, 23, 4, 7, shadow);
  canvas.rect(x + 19 + lean, 23, 4, 7, shadow);
  canvas.rect(x + 11 + lean, 21 + bob, 13, 2, accent);

  if (animation === 'run') {
    canvas.rect(x + 10 + (frame % 2) * 4, 29, 6, 2, trim);
    canvas.rect(x + 20 - (frame % 2) * 4, 29, 6, 2, trim);
  } else {
    canvas.rect(x + 12 + lean, 30, 6, 1, trim);
    canvas.rect(x + 20 + lean, 30, 5, 1, trim);
  }

  drawWeapon(canvas, x, bob, lean, frame, animation, style.weapon, trim, accent, shadow);
}

function drawWeapon(canvas, x, bob, lean, frame, animation, weapon, trim, accent, shadow) {
  const reach = animation === 'attack' ? 5 + frame : animation === 'dash' ? 7 : 0;
  if (weapon === 'katana') {
    canvas.line(x + 21 + lean, 13 + bob, x + 30, 6 + bob - reach, shadow);
    canvas.line(x + 22 + lean, 14 + bob, x + 31, 7 + bob - reach, trim);
    canvas.rect(x + 20 + lean, 15 + bob, 4, 2, accent);
  } else if (weapon === 'claws') {
    canvas.line(x + 22 + lean, 15 + bob, x + 30, 12 + bob - reach, trim);
    canvas.line(x + 22 + lean, 18 + bob, x + 30, 18 + bob - reach, trim);
  } else if (weapon === 'greatsword') {
    canvas.rect(x + 22 + lean, 10 + bob, 3, 15, trim);
    canvas.rect(x + 25 + lean, 8 + bob - reach, 3, 18, accent);
  } else if (weapon === 'lance') {
    canvas.line(x + 22 + lean, 15 + bob, x + 31, 15 + bob - reach, trim);
    canvas.line(x + 22 + lean, 16 + bob, x + 31, 16 + bob - reach, trim);
  } else if (weapon === 'rifle') {
    canvas.rect(x + 21 + lean, 14 + bob, 10, 3, trim);
    canvas.rect(x + 27 + lean, 12 + bob, 3, 2, accent);
  } else if (weapon === 'staff') {
    canvas.line(x + 23 + lean, 8 + bob, x + 28, 25 + bob, trim);
    canvas.rect(x + 27 + lean, 6 + bob - Math.min(reach, 5), 4, 4, accent);
  }
}

for (const [classId, style] of Object.entries(classes)) {
  for (const [animation, frames] of Object.entries(animations)) {
    const canvas = createCanvas(frames * 32, 32);
    for (let frame = 0; frame < frames; frame += 1) {
      drawCharacter(canvas, frame * 32, frame, animation, style);
    }
    savePng(join(root, 'assets', 'sprites', 'player', classId, `${animation}.png`), canvas);
  }
}

function drawTile(name, base, specks) {
  const canvas = createCanvas(32, 32);
  canvas.rect(0, 0, 32, 32, [...base, 255]);
  canvas.rect(0, 0, 32, 4, [Math.min(base[0] + 30, 255), Math.min(base[1] + 30, 255), Math.min(base[2] + 30, 255), 255]);
  canvas.rect(0, 28, 32, 4, [Math.max(base[0] - 16, 0), Math.max(base[1] - 16, 0), Math.max(base[2] - 16, 0), 255]);
  canvas.line(0, 14, 31, 10, [Math.max(base[0] - 12, 0), Math.max(base[1] - 12, 0), Math.max(base[2] - 12, 0), 255]);
  canvas.line(8, 0, 5, 31, [Math.max(base[0] - 10, 0), Math.max(base[1] - 10, 0), Math.max(base[2] - 10, 0), 255]);
  canvas.line(23, 2, 27, 31, [Math.max(base[0] - 8, 0), Math.max(base[1] - 8, 0), Math.max(base[2] - 8, 0), 255]);
  for (let i = 0; i < 70; i += 1) {
    const x = (i * 7 + i * i) % 32;
    const y = (i * 11 + 5) % 32;
    canvas.rect(x, y, i % 3 === 0 ? 3 : 2, 1, [...specks[i % specks.length], 255]);
  }
  for (let i = 0; i < 5; i += 1) {
    const x = (i * 13 + 4) % 28;
    canvas.rect(x, 3 + (i % 2), 6, 1, [126, 147, 132, 255]);
  }
  savePng(join(root, 'assets', 'tiles', `${name}.png`), canvas);
}

drawTile('ground', [44, 52, 57], [[80, 91, 86], [25, 31, 36], [98, 105, 82], [62, 71, 66]]);
drawTile('ledge', [49, 62, 66], [[92, 111, 107], [30, 40, 44], [114, 120, 90], [67, 83, 84]]);
drawTile('secret', [62, 55, 86], [[104, 90, 143], [35, 34, 58], [153, 139, 188], [77, 88, 95]]);

const bg = createCanvas(320, 180);
bg.rect(0, 0, 320, 180, [8, 12, 18, 255]);
bg.rect(0, 92, 320, 88, [12, 18, 25, 255]);
for (let i = 0; i < 10; i += 1) {
  const x = i * 36 + ((i * 17) % 19);
  const h = 70 + ((i * 23) % 62);
  bg.rect(x, 180 - h, 12, h, [18, 25, 31, 255]);
  bg.rect(x + 2, 180 - h, 8, h, [23, 31, 36, 255]);
  bg.rect(x - 3, 180 - h, 18, 4, [31, 39, 42, 255]);
}
for (let i = 0; i < 16; i += 1) {
  const x = i * 24 - 8;
  const y = 58 + ((i * 19) % 56);
  bg.rect(x, y, 34, 5, [20, 29, 34, 255]);
  bg.rect(x + 4, y + 5, 24, 4, [14, 21, 26, 255]);
}
for (let y = 0; y < 180; y += 18) {
  bg.rect(0, y, 320, 1, [15, 23, 31, 255]);
}
for (let i = 0; i < 120; i += 1) {
  const x = (i * 47) % 320;
  const y = (i * 31 + 13) % 150;
  bg.rect(x, y, 2, 2, i % 7 === 0 ? [72, 132, 130, 255] : [25, 34, 42, 255]);
}
bg.rect(0, 156, 320, 24, [10, 15, 20, 255]);
savePng(join(root, 'assets', 'backgrounds', 'cavern.png'), bg);

for (const [classId, style] of Object.entries(classes)) {
  if (classId === 'ninja') continue;
  const icon = createCanvas(32, 32);
  drawCharacter(icon, 0, 0, 'idle', style, { shadowAlpha: 0 });
  savePng(join(root, 'assets', 'icons', 'classes', `${classId}.png`), icon);
}

function drawSpikeTrap() {
  const canvas = createCanvas(32, 32);
  const metal = [184, 196, 210, 255];
  const darkMetal = [74, 85, 104, 255];
  const edge = [230, 236, 244, 255];
  const base = [54, 63, 77, 255];
  canvas.rect(1, 25, 30, 4, base);
  canvas.rect(1, 29, 30, 2, [31, 41, 55, 255]);
  for (let i = 0; i < 4; i += 1) {
    const x = 3 + i * 7;
    canvas.line(x, 24, x + 3, 9, darkMetal);
    canvas.line(x + 6, 24, x + 3, 9, metal);
    canvas.line(x + 3, 9, x + 4, 24, edge);
    canvas.rect(x + 2, 22, 4, 3, [106, 119, 136, 255]);
  }
  savePng(join(root, 'assets', 'sprites', 'traps', 'spikes.png'), canvas);
}

function drawRuneTrap() {
  const canvas = createCanvas(32, 32);
  const blue = [96, 165, 250, 255];
  const bright = [191, 219, 254, 255];
  const violet = [129, 140, 248, 230];
  for (let i = 0; i < 32; i += 1) {
    const angle = (Math.PI * 2 * i) / 32;
    canvas.set(16 + Math.round(Math.cos(angle) * 12), 18 + Math.round(Math.sin(angle) * 8), blue);
    if (i % 2 === 0) {
      canvas.set(16 + Math.round(Math.cos(angle) * 9), 18 + Math.round(Math.sin(angle) * 5), violet);
    }
  }
  canvas.line(8, 18, 24, 18, bright);
  canvas.line(16, 10, 16, 26, bright);
  canvas.line(10, 13, 22, 23, violet);
  canvas.line(22, 13, 10, 23, violet);
  canvas.rect(14, 16, 5, 5, [219, 234, 254, 255]);
  savePng(join(root, 'assets', 'sprites', 'traps', 'rune.png'), canvas);
}

drawSpikeTrap();
drawRuneTrap();

const enemyStyles = {
  slime: { body: [96, 220, 158], shade: [43, 151, 105], accent: [190, 255, 216], shape: 'slime' },
  goblin: { body: [76, 154, 91], shade: [38, 82, 55], accent: [226, 188, 94], shape: 'goblin' },
  archer: { body: [112, 88, 56], shade: [52, 40, 30], accent: [226, 188, 94], shape: 'goblin' },
  flyer: { body: [82, 96, 142], shade: [33, 38, 72], accent: [161, 205, 255], shape: 'bat' },
  elite: { body: [160, 58, 68], shade: [70, 28, 42], accent: [245, 191, 95], shape: 'beast' },
  knight: { body: [105, 114, 132], shade: [39, 47, 61], accent: [198, 211, 231], shape: 'skeleton' },
  mage: { body: [116, 72, 170], shade: [48, 30, 78], accent: [229, 190, 255], shape: 'mage' },
  midboss: { body: [188, 92, 46], shade: [80, 38, 30], accent: [255, 198, 112], shape: 'beast' },
  boss: { body: [126, 88, 194], shade: [49, 34, 86], accent: [255, 155, 210], shape: 'beast' },
  finalBoss: { body: [176, 42, 118], shade: [64, 20, 58], accent: [255, 185, 230], shape: 'shadow' },
};

const enemyAnimations = {
  idle: 4,
  walk: 6,
  attack: 5,
  hurt: 3,
  death: 5,
};

function drawEnemy(canvas, x, frame, animation, style) {
  const bob = animation === 'walk' ? (frame % 2 === 0 ? 1 : -1) : animation === 'death' ? Math.min(frame, 3) : frame % 2;
  const lunge = animation === 'attack' ? Math.min(frame * 2, 6) : 0;
  const hurtShift = animation === 'hurt' ? (frame % 2 === 0 ? -2 : 2) : 0;
  const alpha = animation === 'death' && frame >= 3 ? 180 : 255;
  const body = [...style.body, alpha];
  const shade = [...style.shade, alpha];
  const accent = [...style.accent, alpha];
  const black = [6, 10, 16, alpha];
  const bone = [214, 215, 196, alpha];

  if (style.shape === 'slime') {
    canvas.rect(x + 7 + hurtShift, 20 + bob, 18, 7, body);
    canvas.rect(x + 5 + hurtShift, 23 + bob, 22, 5, shade);
    canvas.rect(x + 11 + hurtShift, 16 + bob, 12, 7, body);
    canvas.rect(x + 13 + hurtShift, 19 + bob, 3, 2, black);
    canvas.rect(x + 21 + hurtShift, 19 + bob, 3, 2, black);
    canvas.rect(x + 16 + hurtShift, 14 + bob, 7, 2, accent);
    return;
  }

  if (style.shape === 'bat') {
    canvas.rect(x + 13 + hurtShift, 13 + bob, 8, 10, body);
    canvas.rect(x + 11 + hurtShift, 10 + bob, 12, 7, shade);
    canvas.line(x + 13 + hurtShift, 16 + bob, x + 2, 10 + bob - lunge, shade);
    canvas.line(x + 13 + hurtShift, 18 + bob, x + 3, 24 + bob, body);
    canvas.line(x + 20 + hurtShift, 16 + bob, x + 31, 10 + bob - lunge, shade);
    canvas.line(x + 20 + hurtShift, 18 + bob, x + 30, 24 + bob, body);
    canvas.rect(x + 14 + hurtShift, 13 + bob, 2, 2, accent);
    canvas.rect(x + 20 + hurtShift, 13 + bob, 2, 2, accent);
    return;
  }

  if (style.shape === 'skeleton') {
    canvas.rect(x + 12 + hurtShift, 6 + bob, 10, 9, bone);
    canvas.rect(x + 14 + hurtShift, 9 + bob, 2, 2, black);
    canvas.rect(x + 20 + hurtShift, 9 + bob, 2, 2, black);
    canvas.rect(x + 13 + hurtShift, 16 + bob, 9, 9, body);
    canvas.rect(x + 10 + hurtShift, 17 + bob, 4, 10, bone);
    canvas.rect(x + 22 + hurtShift, 17 + bob, 4, 10, bone);
    canvas.line(x + 22 + hurtShift, 15 + bob, x + 31, 11 + bob - lunge, accent);
    canvas.rect(x + 13 + hurtShift, 25, 4, 6, bone);
    canvas.rect(x + 19 + hurtShift, 25, 4, 6, bone);
    return;
  }

  if (style.shape === 'mage') {
    canvas.rect(x + 10 + hurtShift, 9 + bob, 14, 17, shade);
    canvas.rect(x + 12 + hurtShift, 6 + bob, 10, 8, body);
    canvas.rect(x + 13 + hurtShift, 11 + bob, 9, 12, body);
    canvas.rect(x + 14 + hurtShift, 10 + bob, 2, 2, accent);
    canvas.rect(x + 20 + hurtShift, 10 + bob, 2, 2, accent);
    canvas.line(x + 23 + hurtShift, 9 + bob, x + 29, 25 + bob, accent);
    canvas.rect(x + 27 + hurtShift + lunge, 7 + bob, 4, 4, accent);
    return;
  }

  const horn = style.shape === 'beast' || style.shape === 'shadow';
  canvas.rect(x + 11 + hurtShift, 7 + bob, 12, 10, body);
  canvas.rect(x + 9 + hurtShift, 15 + bob, 15, 10, shade);
  canvas.rect(x + 12 + hurtShift, 16 + bob, 12, 8, body);
  canvas.rect(x + 13 + hurtShift, 11 + bob, 2, 2, accent);
  canvas.rect(x + 21 + hurtShift, 11 + bob, 2, 2, accent);
  canvas.rect(x + 10 + hurtShift, 25, 5, 6, shade);
  canvas.rect(x + 21 + hurtShift, 25, 5, 6, shade);
  canvas.line(x + 23 + hurtShift, 16 + bob, x + 30, 13 + bob - lunge, accent);
  if (horn) {
    canvas.line(x + 12 + hurtShift, 7 + bob, x + 8, 2 + bob, accent);
    canvas.line(x + 22 + hurtShift, 7 + bob, x + 26, 2 + bob, accent);
  }
  if (style.shape === 'archer' || style.shape === 'goblin') {
    canvas.rect(x + 7 + hurtShift, 17 + bob, 5, 8, body);
    canvas.line(x + 23 + hurtShift, 14 + bob, x + 31, 18 + bob - lunge, accent);
  }
}

for (const [enemyId, style] of Object.entries(enemyStyles)) {
  for (const [animation, frames] of Object.entries(enemyAnimations)) {
    const canvas = createCanvas(frames * 32, 32);
    for (let frame = 0; frame < frames; frame += 1) {
      drawEnemy(canvas, frame * 32, frame, animation, style);
    }
    savePng(join(root, 'assets', 'sprites', 'enemies', enemyId, `${animation}.png`), canvas);
  }
}
