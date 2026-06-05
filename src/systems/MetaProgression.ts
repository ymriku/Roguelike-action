const META_KEY = 'roguelike_meta_points_v1';

export class MetaProgression {
  static getPoints(): number {
    const raw = localStorage.getItem(META_KEY);
    return raw ? Number(raw) : 0;
  }

  static addPoints(n: number): void {
    const current = MetaProgression.getPoints();
    localStorage.setItem(META_KEY, String(current + n));
  }

  static spendPoints(n: number): boolean {
    const current = MetaProgression.getPoints();
    if (current < n) return false;
    localStorage.setItem(META_KEY, String(current - n));
    return true;
  }
}
