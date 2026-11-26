import { readFile, rename, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parse } from 'csv-parse/sync';
import { validateInventory } from './inventory-schema.mjs';

const [, , source, destination = 'content/inventory.json'] = process.argv;
if (!source || !/\.(csv|json)$/i.test(source)) {
  console.error('Uso: npm run import:inventario -- inventario.csv [contenido.json]');
  process.exit(1);
}

try {
  const target = resolve(destination);
  const contents = (await readFile(source, 'utf8')).replace(/^\uFEFF/, '');
  const fromCsv = /\.csv$/i.test(source);
  const imported = fromCsv ? parse(contents, { columns: true, skip_empty_lines: true, trim: true }) : JSON.parse(contents);
  const lots = Array.isArray(imported)
    ? imported.map(row => ({ ...row, area: row.area === '' ? NaN : Number(row.area) }))
    : imported.lots;
  const previous = Array.isArray(imported) ? JSON.parse(await readFile(target, 'utf8')) : imported;
  const inventory = validateInventory({ ...previous, lots, published: false }, previous.published);
  const temporary = `${target}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(inventory, null, 2)}\n`, { flag: 'wx' });
  await rename(temporary, target);
  console.log(`${lots.length} lotes validados. Revisa los polígonos antes de activar la publicación.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
