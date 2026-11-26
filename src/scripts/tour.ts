import type { Tour } from '../data/media';
import { track } from './analytics';

export function setupTour(root: HTMLElement) {
  const tour: Tour = JSON.parse(root.dataset.tour || '');
  const stage = root.querySelector<HTMLElement>('[data-tour-stage]')!;
  const poster = root.querySelector<HTMLElement>('[data-tour-poster]')!;
  const start = root.querySelector<HTMLButtonElement>('[data-tour-start]');
  const status = root.querySelector<HTMLElement>('[data-tour-status]')!;
  const panorama = root.querySelector<HTMLAnchorElement>('[data-tour-panorama]');
  const tracking = root.dataset.tracking === 'true';
  const fail = () => {
    status.textContent = 'El visor no pudo cargar. Puedes abrir el recurso desde el enlace disponible o reintentar.';
    stage.hidden = true;
    stage.replaceChildren();
    poster.hidden = false;
    if (start) start.disabled = false;
  };
  if (tour.kind === 'iframe' && tour.embed === false) {
    root.querySelector('[data-tour-open]')?.addEventListener('click', () => { if (tracking) track('tour_start'); });
  }
  start?.addEventListener('click', async () => {
    start.disabled = true;
    stage.hidden = false;
    poster.hidden = true;
    status.textContent = 'Cargando el visor…';
    if (tracking) track('tour_start');
    try {
      if (tour.kind === 'iframe' || tour.kind === 'video') {
        const element = document.createElement(tour.kind === 'iframe' ? 'iframe' : 'video');
        const timeout = window.setTimeout(() => {
          status.textContent = 'El recurso está tardando. Puedes abrirlo en otra pestaña.';
        }, 12000);
        const loaded = () => { clearTimeout(timeout); status.textContent = ''; };
        element.addEventListener('error', () => { clearTimeout(timeout); fail(); }, { once: true });
        if (element instanceof HTMLIFrameElement) {
          element.title = tour.title;
          element.referrerPolicy = 'no-referrer';
          element.allowFullscreen = true;
          element.addEventListener('load', loaded, { once: true });
        } else {
          element.controls = true;
          element.playsInline = true;
          element.preload = 'metadata';
          element.addEventListener('loadedmetadata', loaded, { once: true });
          element.setAttribute('aria-label', tour.title);
        }
        element.src = tour.src;
        stage.append(element);
      } else {
        if (panorama && tour.kind === 'panorama' && tour.scenes[0]) {
          panorama.href = tour.scenes[0].src;
          panorama.hidden = false;
        }
        const { renderInteractiveTour } = await import('./tour-renderer');
        await renderInteractiveTour(stage, tour, status, panorama);
      }
    } catch { fail(); }
  });
}
