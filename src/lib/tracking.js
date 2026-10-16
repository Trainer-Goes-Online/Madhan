/**
 * Lead tracking for Meta Event Match Quality (EMQ).
 *
 * - Captures first-touch + last-touch attribution (UTMs, fbclid, Meta ad params) across pages.
 * - Maintains _fbp / _fbc cookies and a persistent external_id.
 * - Builds a CAPI-ready payload (plain + SHA-256 hashed user data) and POSTs it to the webhook.
 * - Fires the browser Pixel `Lead` with the same event_id so Meta can deduplicate against CAPI.
 */
import { META_PIXEL_ID, WEBHOOK_URL, FETCH_CLIENT_IP } from '@/lib/config';

const LS = {
  first: 'cx_first_touch',
  last: 'cx_last_touch',
  eid: 'cx_eid',
  am: 'cx_am',
  lead: 'cx_lead',
};

const ATTR_KEYS = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id',
  'fbclid', 'gclid', 'wbraid', 'gbraid', 'ttclid', 'msclkid',
  'ad_id', 'adset_id', 'campaign_id', 'ad_name', 'adset_name', 'campaign_name',
  'placement', 'site_source_name', 'h_ad_id',
];

const NINETY_DAYS = 90 * 24 * 60 * 60;

/* ---------------- storage helpers ---------------- */
const store = {
  get(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ }
  },
};

export function getCookie(name) {
  const m = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[.$?*|{}()[\]\\/+^]/g, '\\$&') + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : '';
}

function rootDomain() {
  const host = location.hostname;
  if (/^[\d.]+$/.test(host) || host === 'localhost') return '';
  const parts = host.split('.');
  return parts.length > 2 ? '.' + parts.slice(-2).join('.') : '.' + host;
}

function setCookie(name, value, maxAge = NINETY_DAYS) {
  const domain = rootDomain();
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax${
    domain ? `; Domain=${domain}` : ''
  }${location.protocol === 'https:' ? '; Secure' : ''}`;
}

/* ---------------- identity ---------------- */
function uuid() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function getExternalId() {
  let id = '';
  try { id = localStorage.getItem(LS.eid) || ''; } catch { /* noop */ }
  if (!id) {
    id = uuid();
    try { localStorage.setItem(LS.eid, id); } catch { /* noop */ }
  }
  return id;
}

/** _fbc must be refreshed whenever a new fbclid arrives. */
function syncFbc(fbclid) {
  if (!fbclid) return;
  const existing = getCookie('_fbc');
  if (existing && existing.endsWith('.' + fbclid)) return;
  setCookie('_fbc', `fb.1.${Date.now()}.${fbclid}`);
}

/** Pixel normally sets _fbp; if it was blocked we still want a stable browser id for CAPI. */
function ensureFbp() {
  let fbp = getCookie('_fbp');
  if (!fbp) {
    fbp = `fb.1.${Date.now()}.${Math.floor(1e9 + Math.random() * 9e9)}`;
    setCookie('_fbp', fbp);
  }
  return fbp;
}

/* ---------------- attribution ---------------- */
export function captureAttribution() {
  const params = new URLSearchParams(location.search);
  const found = {};
  ATTR_KEYS.forEach((k) => {
    const v = params.get(k);
    if (v) found[k] = v.slice(0, 500);
  });

  syncFbc(found.fbclid);
  getExternalId();

  const touch = {
    ...found,
    landing_page: location.href,
    referrer: document.referrer || '',
    timestamp: new Date().toISOString(),
  };

  if (!store.get(LS.first)) store.set(LS.first, touch);
  // Only overwrite last-touch when this visit carries campaign data.
  if (Object.keys(found).length || !store.get(LS.last)) store.set(LS.last, touch);
}

export function getAttribution() {
  const first = store.get(LS.first) || {};
  const last = store.get(LS.last) || {};
  const flat = {};
  ATTR_KEYS.forEach((k) => {
    flat[k] = last[k] || first[k] || '';
  });
  return { flat, first, last };
}

/** Query string to forward attribution into the GHL calendar so it lands on the contact. */
export function attributionQuery() {
  const { flat } = getAttribution();
  const out = new URLSearchParams();
  Object.entries(flat).forEach(([k, v]) => v && out.set(k, v));
  return out;
}

/* ---------------- normalisation + hashing ---------------- */
const norm = {
  email: (v) => String(v || '').trim().toLowerCase(),
  name: (v) => String(v || '').trim().toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^\p{L}\s-]/gu, '').trim(),
  phone: (v) => String(v || '').replace(/\D/g, '').replace(/^0+/, ''),
  plain: (v) => String(v || '').trim().toLowerCase(),
};

async function sha256(value) {
  if (!value || !crypto?.subtle) return '';
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function getClientIp() {
  if (!FETCH_CLIENT_IP) return '';
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 1500);
    const res = await fetch('https://api64.ipify.org?format=json', { signal: ctrl.signal });
    clearTimeout(t);
    const data = await res.json();
    return data.ip || '';
  } catch {
    return '';
  }
}

function deviceType() {
  const w = window.innerWidth;
  if (w < 768) return 'mobile';
  if (w < 1100) return 'tablet';
  return 'desktop';
}

/* ---------------- lead submission ---------------- */
/**
 * @param {{firstName:string,lastName:string,email:string,dialCode:string,countryIso:string,phone:string}} form
 */
export async function submitLead(form) {
  const eventId = `lead.${getExternalId()}.${Date.now()}`;
  const eventTime = Math.floor(Date.now() / 1000);

  const email = norm.email(form.email);
  const dial = norm.phone(form.dialCode);
  const local = norm.phone(form.phone);
  const phoneDigits = local.startsWith(dial) && local.length > 10 ? local : dial + local;
  const fn = norm.name(form.firstName);
  const ln = norm.name(form.lastName);
  const country = norm.plain(form.countryIso);
  const externalId = getExternalId();

  const fbp = ensureFbp();
  const fbc = getCookie('_fbc');
  const { flat, first, last } = getAttribution();

  const [emH, phH, fnH, lnH, countryH, extH, ip] = await Promise.all([
    sha256(email), sha256(phoneDigits), sha256(fn), sha256(ln), sha256(country), sha256(externalId), getClientIp(),
  ]);

  const firstName = String(form.firstName).trim();
  const lastName = String(form.lastName).trim();

  const payload = {
    // Flat contact + UTM fields: easy mapping in GHL / Zapier / Make
    first_name: firstName,
    last_name: lastName,
    full_name: `${firstName} ${lastName}`.trim(),
    email,
    phone: `+${phoneDigits}`,
    phone_country_code: `+${dial}`,
    country: country.toUpperCase(),
    ...flat,

    // Meta Conversions API shaped event
    event_name: 'Lead',
    event_id: eventId,
    event_time: eventTime,
    event_source_url: location.href,
    action_source: 'website',
    user_data: {
      em: [emH],
      ph: [phH],
      fn: [fnH],
      ln: [lnH],
      country: [countryH],
      external_id: [extH],
      fbp,
      fbc,
      client_user_agent: navigator.userAgent,
      client_ip_address: ip,
    },
    custom_data: {
      content_name: 'Strategy Call Application',
      content_category: 'Calisthenics Coaching',
      lead_type: 'strategy_call',
    },
    pixel_id: META_PIXEL_ID,

    // Raw identifiers (unhashed) for your own CRM / debugging
    identifiers: { external_id: externalId, fbp, fbc, fbclid: flat.fbclid, client_ip_address: ip },
    attribution: { first_touch: first, last_touch: last },
    page: {
      url: location.href,
      path: location.pathname,
      title: document.title,
      referrer: document.referrer,
    },
    device: {
      user_agent: navigator.userAgent,
      language: navigator.language,
      languages: navigator.languages?.join(',') || '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      device_type: deviceType(),
    },
    form: { name: 'Strategy Call Application', submitted_at: new Date().toISOString() },
  };

  // Persist for the booking page (calendar prefill) and pixel advanced matching on later pages.
  store.set(LS.lead, {
    firstName, lastName, email, phone: `+${phoneDigits}`, savedAt: Date.now(),
  });
  const am = { em: email, ph: phoneDigits, fn, ln, country, external_id: externalId };
  store.set(LS.am, am);

  firePixelLead(eventId, am);
  await postWebhook(payload);
  return payload;
}

function firePixelLead(eventId, am) {
  if (typeof window.fbq !== 'function' || !META_PIXEL_ID) return;
  try {
    // Re-init with advanced matching so the browser event carries hashed user data too.
    window.fbq('init', META_PIXEL_ID, am);
    window.fbq('track', 'Lead', { content_name: 'Strategy Call Application' }, { eventID: eventId });
  } catch { /* never block the funnel */ }
}

async function postWebhook(payload) {
  if (!WEBHOOK_URL) {
    console.warn('[tracking] NEXT_PUBLIC_WEBHOOK_URL is not set; lead payload:', payload);
    return;
  }
  const body = JSON.stringify(payload);
  const withTimeout = (p, ms) => Promise.race([p, new Promise((r) => setTimeout(r, ms))]);

  try {
    // A non-2xx response means the request was delivered, so only network/CORS errors fall through.
    await withTimeout(
      fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }),
      4000,
    );
  } catch {
    // CORS-restricted endpoints reject the JSON preflight; resend as a "simple" text/plain request.
    try {
      const ok = navigator.sendBeacon?.(WEBHOOK_URL, new Blob([body], { type: 'text/plain' }));
      if (!ok) {
        await fetch(WEBHOOK_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body, keepalive: true });
      }
    } catch { /* swallow */ }
  }
}

/* ---------------- misc pixel helpers ---------------- */
export function trackCustom(name, data = {}) {
  try { window.fbq?.('trackCustom', name, data); } catch { /* noop */ }
}

export function track(name, data = {}, eventId) {
  try { window.fbq?.('track', name, data, eventId ? { eventID: eventId } : undefined); } catch { /* noop */ }
}

const LEAD_TTL = 14 * 24 * 60 * 60 * 1000;
export function getSavedLead() {
  const lead = store.get(LS.lead);
  if (!lead || Date.now() - (lead.savedAt || 0) > LEAD_TTL) return null;
  return lead;
}
