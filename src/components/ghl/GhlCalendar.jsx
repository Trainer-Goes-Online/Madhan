'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { attributionQuery, getSavedLead } from '@/lib/tracking';
import { GHL_CALENDAR_URL } from '@/lib/config';

/**
 * GHL calendar widget embed (link set by NEXT_PUBLIC_GHL_CALENDAR_URL). Prefills the lead captured
 * by the popup form and forwards UTM / click IDs so they land on the GHL contact.
 */
export default function GhlCalendar({ className }) {
  const [frame, setFrame] = useState(null);

  useEffect(() => {
    let url;
    try {
      url = new URL(GHL_CALENDAR_URL);
    } catch {
      console.warn('[calendar] NEXT_PUBLIC_GHL_CALENDAR_URL is not a valid URL:', GHL_CALENDAR_URL);
      return;
    }
    attributionQuery().forEach((v, k) => url.searchParams.set(k, v));
    const lead = getSavedLead();
    if (lead) {
      if (lead.firstName) url.searchParams.set('first_name', lead.firstName);
      if (lead.lastName) url.searchParams.set('last_name', lead.lastName);
      if (lead.email) url.searchParams.set('email', lead.email);
      if (lead.phone) url.searchParams.set('phone', lead.phone);
    }
    // form_embed.js auto-resizes iframes whose id is "<widgetId>_<timestamp>".
    const widgetId = url.pathname.split('/').filter(Boolean).pop() || 'calendar';
    setFrame({ id: `${widgetId}_${Date.now()}`, src: url.toString() });
  }, []);

  return (
    <div className={className} is-preview="false">
      <div id="calendarAppointmentBookingMain">
        {frame ? (
          <>
            <iframe
              src={frame.src}
              id={frame.id}
              title="Book a call"
              scrolling="no"
              style={{ width: '100%', border: 'none', overflow: 'hidden', minHeight: 700 }}
            ></iframe>
            <Script src="https://link.msgsndr.com/js/form_embed.js" strategy="afterInteractive" />
          </>
        ) : (
          <div id="appointment_widgets--revamp" className="hl-app">
            <div>
              <div className="calendars-ellipsis-loader">
                <div>
                  <div className="bt-spinner" style={{ borderTopColor: '#155eef' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
