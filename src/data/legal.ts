import settings from '../../content/legal.json';

export type LegalPage = { url?: string; paragraphs?: string[] };
export const legal = settings as { privacidad: LegalPage; reclamaciones: LegalPage };
export const legalLink = (key: keyof typeof legal) =>
  legal[key].url || (legal[key].paragraphs?.some(text => text.trim()) ? `/${key}/` : '');
