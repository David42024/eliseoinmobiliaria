import { track } from './analytics';

export function setupLotViewer(root: HTMLElement) {
  const svg = root.querySelector<SVGSVGElement>('.lot-map')!;
  const entries = Array.from(root.querySelectorAll<HTMLLIElement>('[data-lot]')).map(row => ({
    row, id: row.dataset.lot!, button: row.querySelector('button')!,
  }));
  const polygons = new Map(Array.from(svg.querySelectorAll<SVGPolygonElement>('polygon[data-polygon]'), element => [element.dataset.polygon!, element]));
  const details = new Map(Array.from(root.querySelectorAll<HTMLElement>('[data-detail]'), element => [element.dataset.detail!, element]));
  const count = root.querySelector<HTMLElement>('[data-count]')!;
  const selection = root.querySelector<HTMLElement>('[data-selection]')!;
  const prompt = root.querySelector<HTMLElement>('[data-prompt]')!;
  const status = root.querySelector<HTMLSelectElement>('[data-status]')!;
  const min = root.querySelector<HTMLInputElement>('[data-min]')!;
  const max = root.querySelector<HTMLInputElement>('[data-max]')!;
  let selected = '';

  function select(id: string) {
    if (id === selected) return;
    selected = id;
    for (const item of entries) {
      item.button.setAttribute('aria-pressed', String(item.id === id));
      polygons.get(item.id)?.classList.toggle('selected', item.id === id);
      const detail = details.get(item.id);
      if (detail) detail.hidden = item.id !== id;
    }
    prompt.hidden = !!id;
    selection.textContent = id ? `Lote seleccionado: ${id}` : 'Sin lote seleccionado';
    if (id && !root.querySelector('.demo-tag')) track('select_lot', { lot_id: id });
  }

  for (const item of entries) item.button.addEventListener('click', () => select(item.id));

  function filter() {
    let visible = 0;
    const rangeInvalid = min.value !== '' && max.value !== '' && min.valueAsNumber > max.valueAsNumber;
    for (const { row, id } of entries) {
      const area = Number(row.dataset.area);
      row.hidden = rangeInvalid || !!(status.value && status.value !== row.dataset.statusValue) ||
        (min.value !== '' && area < min.valueAsNumber) || (max.value !== '' && area > max.valueAsNumber);
      polygons.get(id)?.classList.toggle('filtered', row.hidden);
      if (!row.hidden) visible++;
      if (row.hidden && id === selected) select('');
    }
    count.textContent = rangeInvalid ? 'El área mínima supera el área máxima.' :
      visible ? `${visible} ${visible === 1 ? 'lote' : 'lotes'} para explorar` : 'No hay lotes que coincidan con los filtros.';
  }
  [status, min, max].forEach(input => input.addEventListener('input', filter));

  const viewBox = svg.viewBox.baseVal;
  const initial = [viewBox.x, viewBox.y, viewBox.width, viewBox.height];
  let [x, y, width, height] = initial;
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.style.aspectRatio = `${width} / ${height}`;
  function draw() {
    const [left, top, fullWidth, fullHeight] = initial;
    x = Math.max(left, Math.min(left + fullWidth - width, x));
    y = Math.max(top, Math.min(top + fullHeight - height, y));
    svg.setAttribute('viewBox', [x, y, width, height].join(' '));
  }
  function zoom(factor: number, atX = .5, atY = .5) {
    const nextWidth = Math.max(initial[2] / 6, Math.min(initial[2], width * factor));
    const nextHeight = nextWidth * initial[3] / initial[2];
    x += (width - nextWidth) * atX;
    y += (height - nextHeight) * atY;
    width = nextWidth;
    height = nextHeight;
    draw();
  }

  root.querySelector('[data-zoom="in"]')?.addEventListener('click', () => zoom(.75));
  root.querySelector('[data-zoom="out"]')?.addEventListener('click', () => zoom(4 / 3));
  root.querySelector('[data-zoom="reset"]')?.addEventListener('click', () => { [x, y, width, height] = initial; draw(); });

  const pointers = new Map<number, PointerEvent>();
  let dragging = false;
  let target = '';
  svg.addEventListener('pointerdown', event => {
    if (event.button !== 0 || pointers.size >= 2) return;
    if (!pointers.size) {
      dragging = false;
      target = (event.target as SVGElement).closest<SVGPolygonElement>('polygon[data-polygon]')?.dataset.polygon || '';
    } else dragging = true;
    pointers.set(event.pointerId, event);
    svg.setPointerCapture(event.pointerId);
  });
  svg.addEventListener('pointermove', event => {
    const last = pointers.get(event.pointerId);
    if (!last) return;
    const moving = Math.abs(event.clientX - last.clientX) + Math.abs(event.clientY - last.clientY) > 4;
    if (!dragging && !moving) return;
    dragging = true;
    const bounds = svg.getBoundingClientRect();
    const other = Array.from(pointers.values()).find(pointer => pointer.pointerId !== event.pointerId);
    if (other) {
      const before = Math.hypot(last.clientX - other.clientX, last.clientY - other.clientY);
      const after = Math.hypot(event.clientX - other.clientX, event.clientY - other.clientY);
      if (before > 0 && after > 0) zoom(before / after, ((event.clientX + other.clientX) / 2 - bounds.left) / bounds.width,
        ((event.clientY + other.clientY) / 2 - bounds.top) / bounds.height);
    }
    const step = other ? 2 : 1;
    x -= (event.clientX - last.clientX) * width / bounds.width / step;
    y -= (event.clientY - last.clientY) * height / bounds.height / step;
    draw();
    pointers.set(event.pointerId, event);
  });
  svg.addEventListener('pointerup', event => {
    if (!pointers.has(event.pointerId)) return;
    pointers.delete(event.pointerId);
    if (!dragging && target) select(target);
  });
  svg.addEventListener('pointercancel', event => pointers.delete(event.pointerId));
}
