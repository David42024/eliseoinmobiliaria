import type { APIRoute } from 'astro';
import { official } from '../../data/inventory';
import { legalLink } from '../../data/legal';
import { project } from '../../data/project';

export const prerender = false;
const MAX_BODY = 4096;
const windowMs = 15 * 60 * 1000;
const attempts = new Map<string, { until: number; count: number }>();
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const respond = (status: number, confirmed = false) => Response.json({ confirmed }, {
  status, headers: { 'Cache-Control': 'no-store' },
});

async function readBody(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) return null;
  const decoder = new TextDecoder();
  let text = '';
  let size = 0;
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    size += chunk.value.byteLength;
    if (size > MAX_BODY) { await reader.cancel(); return null; }
    text += decoder.decode(chunk.value, { stream: true });
  }
  return JSON.parse(text + decoder.decode());
}

export const POST: APIRoute = async ({ request, clientAddress, locals, site, url }) => {
  const { CRM_WEBHOOK_URL: webhook, CRM_WEBHOOK_TOKEN: token, CRM_COPY_TO: copyTo } = locals.runtime?.env ?? process.env;
  if (import.meta.env.PUBLIC_LEAD_FORM !== 'true' || !legalLink('privacidad') || !token || !webhook?.startsWith('https://')) return respond(503);
  if (request.headers.get('origin') !== (site?.origin || url.origin) ||
    request.headers.get('content-type')?.split(';')[0] !== 'application/json') return respond(403);
  const key = request.headers.get('idempotency-key') || '';
  if (!uuid.test(key) || Number(request.headers.get('content-length')) > MAX_BODY) return respond(400);
  const now = Date.now();
  for (const [ip, entry] of attempts) if (entry.until <= now) attempts.delete(ip);
  const rate = attempts.get(clientAddress) || { until: now + windowMs, count: 0 };
  if (++rate.count > 10 || attempts.size >= 10000) return respond(429);
  attempts.set(clientAddress, rate);

  let payload: Record<string, unknown>;
  try { payload = await readBody(request); } catch { return respond(400); }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload) || payload.website !== '' ||
    payload.project !== project.id || payload.consent !== true) return respond(400);
  const clean = (value: unknown) => typeof value === 'string' ? value.trim() : '';
  const name = clean(payload.name);
  const rawPhone = clean(payload.phone);
  const phone = rawPhone.replace(/[ ()-]/g, '');
  const email = clean(payload.email);
  const purpose = clean(payload.purpose);
  const type = clean(payload.type);
  const lotId = clean(payload.lot);
  const lot = official.published ? official.lots.find(item => item.id === lotId) : undefined;
  if (name.length < 2 || name.length > 100 || /[\x00-\x1F\x7F]/.test(name) ||
    rawPhone.length > 24 || !/^(?:\+?51)?9\d{8}$/.test(phone) ||
    email.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !['informacion', 'visita', 'cotizacion'].includes(purpose) ||
    (type && !project.typologies.some(item => item.id === type)) || (lotId && (!lot || lot.type !== type))) return respond(400);

  const attribution = Object.fromEntries(Object.entries(payload.attribution && typeof payload.attribution === 'object' ? payload.attribution : {})
    .filter(([field, value]) => /^utm_(source|medium|campaign|content|term)$/.test(field) && typeof value === 'string' && /^[\p{L}\p{N}_.-]{1,80}$/u.test(value)));
  try {
    const result = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'Idempotency-Key': key },
      body: JSON.stringify({
        name, phone: `+51${phone.slice(-9)}`, email, purpose, project: project.id, type, lot: lotId,
        consent: true, consentAt: new Date(now).toISOString(), attribution, requestId: key,
        copyTo: copyTo || undefined,
      }),
      signal: AbortSignal.timeout(7000),
      redirect: 'error',
    });
    if (!result.ok) return respond(502);
    const receipt = await result.json();
    return receipt?.confirmed === true && typeof receipt.id === 'string' && receipt.id.trim()
      ? respond(201, true) : respond(502);
  } catch {
    return respond(502);
  }
};
