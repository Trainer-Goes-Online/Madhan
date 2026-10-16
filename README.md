# CalisTNx funnel (Next.js replica of the GHL funnel)

A page-for-page replica of the Havoc Madhan GoHighLevel funnel, rebuilt in React (Next.js App Router, plain JS).
The markup keeps GHL's element IDs and classes and uses GHL's own CSS, so every page renders the same as the live site on desktop, tablet and mobile.

## Pages

| Route | Original GHL page |
| --- | --- |
| `/` and `/calistnx` | https://havocmadhan.com/calistnx |
| `/call-bookingpage` | https://havocmadhan.com/call-bookingpage |
| `/thank-you-page-` | https://havocmadhan.com/thank-you-page- |
| `/application` | https://havocmadhan.com/application |
| `/masterclass` | https://havocmadhan.com/masterclass |
| `/masterclass-page` | https://havocmadhan.com/masterclass-page |
| `/terms-and-condition-page` | https://havocmadhan.com/terms-and-condition-page |
| `/results` | https://havocmadhan.com/results |

## Run it

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
npm run build && npm start   # production
```

## Structure

```
src/
  app/                      one folder per route (page.jsx sets the page title and imports its CSS)
  components/
    pages/                  one component per GHL page (sections, rows, columns, elements)
    ghl/                    the interactive GHL elements
      GhlPage.jsx           page wrapper + popup state
      GhlButton.jsx         buttons (open the popup)
      LeadFormPopup.jsx     the "BOOK MY STRATEGY CALL" popup form (+ exit-intent), ghl-form.css
      VimeoVideo.jsx        Vimeo videos (testimonials + webinar): muted autoplay in view, "Enable sound", Vimeo analytics on
      EmbedVideo.jsx        YouTube / Wistia link videos
      WistiaEmbed.jsx       the main VSL (Wistia player)
      Faq.jsx               FAQ accordion
      GhlCalendar.jsx       GHL booking calendar embed (prefilled from the popup form)
    TrackingInit.jsx        captures UTMs / click IDs on every page
  lib/
    tracking.js             Meta Pixel + webhook lead submission
    config.js               env values and the booking path
  styles/
    ghl-base.css            GHL framework CSS
    pages/*.css             per-page GHL CSS
public/images/              all page images (local files)
```

## Lead form and tracking

The popup form (First Name, Phone, Email) works like the GHL form. On submit it:

1. Sends the lead to `NEXT_PUBLIC_WEBHOOK_URL`. The payload includes:
   - contact fields;
   - first-touch and last-touch UTMs and click IDs (fbclid, gclid and others);
   - fbp and fbc;
   - SHA-256 hashed user data shaped for the Meta Conversions API;
   - an `event_id` for deduplication.
2. Fires the Meta Pixel `Lead` event with advanced matching and the same `event_id`.
3. Redirects to `/call-bookingpage`. The calendar there is prefilled with the name, email and phone, plus the UTMs.

Point the webhook at whatever should receive the leads (your CRM, Make, Zapier, n8n or a Conversions API server).

The `/application` page fires `Lead` on load, the same as its GHL page header code.

## Assets

All images, icons and fonts are self-hosted in `public/`:

- `public/images/`: page images, video thumbnails and icons.
- `public/fonts/fontawesome/`: icon font used by the FAQ arrows.

The only external services are:

- Google Fonts;
- videos: testimonials and the masterclass webinar on Vimeo (player.vimeo.com links in the page components), the Wistia VSL, and the YouTube and Wistia videos;
- the Google Form on `/application`;
- the Meta Pixel;
- the booking calendar on `/call-bookingpage`: the GoHighLevel calendar widget, whose link is set by `NEXT_PUBLIC_GHL_CALENDAR_URL`. Set the post-booking redirect to `/thank-you-page-` in the GHL calendar settings.
