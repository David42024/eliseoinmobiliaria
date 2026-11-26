export const statuses = ['libre', 'separado', 'vendido'];
const types = ['lote-unifamiliar', 'departamento-multifamiliar', 'casa-conjunto'];
const token = /^[a-z0-9][a-z0-9_-]{0,63}$/i;
const text = value => typeof value === 'string' && value.trim().length > 0 && value.length <= 100;

export function validateInventory(inventory, requirePlan = inventory.published) {
  if (typeof inventory.published !== 'boolean' || !Array.isArray(inventory.lots) ||
    !Array.isArray(inventory.viewBox) || inventory.viewBox.length !== 4 ||
    !inventory.viewBox.every(Number.isFinite) || inventory.viewBox[2] <= 0 || inventory.viewBox[3] <= 0 ||
    !inventory.geometries || typeof inventory.geometries !== 'object' || Array.isArray(inventory.geometries) ||
    typeof inventory.planImage !== 'string' ||
    (inventory.planImage && !(/^\/(?!\/)[^\\]+$|^https:\/\/[^\s]+$/).test(inventory.planImage))) {
    throw new Error('El inventario debe incluir published, lots, viewBox, geometries y planImage válidos.');
  }
  if (requirePlan && !inventory.lots.length) throw new Error('El inventario publicado requiere al menos un lote.');

  for (const [id, points] of Object.entries(inventory.geometries)) {
    const coordinates = typeof points === 'string' ? points.trim().split(/\s+/) : [];
    if (!token.test(id) || coordinates.length < 3 || coordinates.some(pair => {
      const values = pair.split(',');
      return values.length !== 2 || values.some(value => value === '' || !Number.isFinite(Number(value)));
    })) throw new Error(`Polígono inválido: ${id}.`);
  }

  const ids = new Set();
  const assigned = new Set();
  for (const lot of inventory.lots) {
    if (typeof lot?.id !== 'string' || !token.test(lot.id) || ids.has(lot.id.toUpperCase())) {
      throw new Error(`ID de lote inválido o duplicado: ${lot?.id}.`);
    }
    if (!text(lot.block) || !types.includes(lot.type) || !Number.isFinite(lot.area) || lot.area <= 0 ||
      !text(lot.orientation) || !text(lot.location) || !statuses.includes(lot.status) ||
      typeof lot.geometry !== 'string' || !token.test(lot.geometry)) {
      throw new Error(`Campos de inventario inválidos para ${lot.id}.`);
    }
    if (assigned.has(lot.geometry) || (requirePlan && !Object.hasOwn(inventory.geometries, lot.geometry))) {
      throw new Error(`Referencia geométrica duplicada o ausente para ${lot.id}.`);
    }
    ids.add(lot.id.toUpperCase());
    assigned.add(lot.geometry);
  }
  return inventory;
}
