import Script from 'next/script';
import '@/styles/ghl-base.css';
import TrackingInit from '@/components/TrackingInit';
import { META_PIXEL_ID, SITE_URL } from '@/lib/config';

// Every font family used across the GHL pages (Montserrat, Roboto, Lato, Open Sans, Inter, Space Grotesk).
const FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&family=Montserrat:ital,wght@0,100..900;1,100..900&family=Open+Sans:ital,wght@0,300..800;1,300..800&family=Roboto:ital,wght@0,100..900;1,100..900&family=Space+Grotesk:wght@300..700&display=swap';

export const metadata = {
  ...(SITE_URL ? { metadataBase: new URL(SITE_URL) } : {}),
  icons: { icon: '/favicon.ico' },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

// Restores advanced matching (hashed by the Pixel) from a previous form submission for better EMQ.
const pixelBootstrap = `
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
(function(){var am={};try{am=JSON.parse(localStorage.getItem('cx_am')||'{}');var eid=localStorage.getItem('cx_eid');if(!eid){eid=(crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random().toString(16).slice(2));localStorage.setItem('cx_eid',eid)}am.external_id=eid}catch(e){}
fbq('init','${META_PIXEL_ID}',am);fbq('track','PageView');})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com/" crossOrigin="anonymous" />
        <link rel="stylesheet" href={FONTS_URL} />
      </head>
      <body>
        {META_PIXEL_ID && (
          <>
            <Script id="meta-pixel" strategy="afterInteractive">{pixelBootstrap}</Script>
            <noscript>
              <img height="1" width="1" style={{ display: 'none' }} alt="" src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`} />
            </noscript>
          </>
        )}
        <TrackingInit />
        <div id="__nuxt">{children}</div>
      </body>
    </html>
  );
}
