import type { APIRoute } from 'astro';
import { navigation, project, spacePath, typologyPath } from '../data/project';
export const GET: APIRoute = ({ site }) => {
  const locations = site ? ['/', ...navigation.map(([, path]) => path), ...project.typologies.map(typologyPath), ...project.spaces.map(spacePath)] : [];
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${locations.map(path => `<url><loc>${new URL(path, site)}</loc></url>`).join('')}</urlset>`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
