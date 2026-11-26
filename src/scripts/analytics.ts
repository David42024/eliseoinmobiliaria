type AnalyticsValue = string | number | boolean;
type AnalyticsWindow = Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };
const analytics = window as AnalyticsWindow;
const siteId = document.body.dataset.ga4;
const key = 'eliseo-medicion';
const utmFields = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
const campaign = new URLSearchParams(location.search);
const consent = document.querySelector<HTMLElement>('#analytics-consent');
const cleanUtm = (value?: string | null) => (value ?? '').trim().replace(/[^\p{L}\p{N}_.-]/gu, '').slice(0, 80);
const currentCampaign = Object.fromEntries(utmFields.flatMap(field => {
  const value = cleanUtm(campaign.get(field));
  return value ? [[field, value]] : [];
}));
let attribution = currentCampaign;
try {
  if (Object.keys(currentCampaign).length) sessionStorage.setItem('eliseo-campaign', JSON.stringify(currentCampaign));
  else attribution = JSON.parse(sessionStorage.getItem('eliseo-campaign') || '{}');
} catch {
  // Los parámetros de esta página siguen disponibles sin almacenamiento.
}
export { attribution };

function initialize() {
  if (!siteId) return;
  Object.assign(analytics, { [`ga-disable-${siteId}`]: false });
  if (analytics.gtag) return;
  analytics.dataLayer = analytics.dataLayer || [];
  analytics.gtag = function () { analytics.dataLayer!.push(arguments); };
  analytics.gtag('js', new Date());
  const source = String(attribution.utm_source || '').toLowerCase();
  const medium = String(attribution.utm_medium || '').toLowerCase();
  const campaignSource = /^(meta|facebook|instagram|fb|ig)$/.test(source) ? 'meta' :
    /^(tiktok|tt)$/.test(source) ? 'tiktok' : undefined;
  const campaignMedium = /^(paid_social|paid-social|cpc|paid)$/.test(medium) ? 'paid_social' :
    /^(social|organic_social)$/.test(medium) ? 'social' : undefined;
  analytics.gtag('config', siteId, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    page_location: location.origin + location.pathname,
    page_referrer: '',
    ...(campaignSource ? { campaign_source: campaignSource } : {}),
    ...(campaignSource && campaignMedium ? { campaign_medium: campaignMedium } : {}),
  });
  analytics.gtag('event', 'page_view', { page_location: location.origin + location.pathname, page_referrer: '' });
  const script = document.createElement('script');
  script.async = true;
  script.referrerPolicy = 'no-referrer';
  script.src = `https://www.googletagmanager.com/gtag/js?id=${siteId}`;
  document.head.append(script);
}

export function track(event: string, fields: Record<string, AnalyticsValue> = {}) {
  if (siteId && !Reflect.get(analytics, `ga-disable-${siteId}`)) {
    analytics.gtag?.('event', event, { ...fields, project_id: 'la-nueva-estancia' });
  }
}

try {
  if (localStorage.getItem(key) === 'allow') initialize();
  else if (consent && !localStorage.getItem(key)) consent.hidden = false;
} catch { if (consent) consent.hidden = false; }
document.querySelector('[data-analytics-settings]')?.addEventListener('click', () => {
  if (consent) consent.hidden = !consent.hidden;
});
document.querySelectorAll<HTMLElement>('[data-consent]').forEach(button => button.addEventListener('click', () => {
  const allowed = button.dataset.consent === 'allow';
  try { localStorage.setItem(key, allowed ? 'allow' : 'deny'); } catch { /* Sigue vigente en esta página. */ }
  if (allowed) initialize();
  else if (siteId) Object.assign(analytics, { [`ga-disable-${siteId}`]: true });
  if (consent) consent.hidden = true;
}));
document.addEventListener('click', event => {
  if (event.target instanceof Element && event.target.closest('a[data-whatsapp]')) track('whatsapp_click');
});
