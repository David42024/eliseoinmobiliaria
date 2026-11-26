import data from '../../content/inventory.json';
import { validateInventory } from '../../scripts/inventory-schema.mjs';

export type Status = 'libre' | 'separado' | 'vendido';
export type Lot = {
  id: string;
  block: string;
  type: string;
  area: number;
  orientation: string;
  location: string;
  status: Status;
  geometry: string;
};
export type Inventory = {
  published: boolean;
  viewBox: number[];
  planImage: string;
  geometries: Record<string, string>;
  lots: Lot[];
};

export const statusLabel: Record<Status, string> = { libre: 'Libre', separado: 'Separado', vendido: 'Vendido' };
export const official = validateInventory(data) as Inventory;
const demoFiles = import.meta.glob<{ default: Inventory }>('../../content/inventory-demo.json', { eager: true });
export const demo = import.meta.env.DEV
  ? validateInventory(demoFiles['../../content/inventory-demo.json'].default, true) as Inventory
  : null;
export const inventory = official.published ? official : demo;
