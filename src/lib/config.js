// NEXT_PUBLIC_* values are inlined at build time, so each must be referenced literally.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '';
export const WEBHOOK_URL = process.env.NEXT_PUBLIC_WEBHOOK_URL || '';
export const FETCH_CLIENT_IP = String(process.env.NEXT_PUBLIC_FETCH_CLIENT_IP ?? 'true') !== 'false';

// Next funnel step after the popup form (same as the GHL funnel).
export const BOOKING_PATH = '/call-bookingpage';

// GHL calendar widget link (Calendars > Share > Permanent link). Falls back to the current "Discovery Call" calendar.
export const GHL_CALENDAR_URL = (
  process.env.NEXT_PUBLIC_GHL_CALENDAR_URL || 'https://api.leadconnectorhq.com/widget/booking/Xcv46tGXDlWb2Rw4NlOL'
).trim();
