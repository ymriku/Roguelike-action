import { Item } from '../items/Item';

export type ItemStack = {
  item: Item;
  quantity: number;
};

export class Inventory {
  private items: ItemStack[] = [];

  add(item: Item): void {
    const existing = this.items.find((stack) => stack.item.id === item.id);
    if (existing) {
      existing.quantity += 1;
      return;
    }
    this.items.push({ item, quantity: 1 });
  }

  remove(index: number): Item | undefined {
    if (index < 0 || index >= this.items.length) return undefined;
    const stack = this.items[index];
    stack.quantity -= 1;
    const removed = stack.item;
    if (stack.quantity <= 0) {
      this.items.splice(index, 1);
    }
    return removed;
  }

  getAll(): ItemStack[] {
    return this.items.map((stack) => ({ item: stack.item, quantity: stack.quantity }));
  }
}
