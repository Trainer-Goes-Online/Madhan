'use client';

import Script from 'next/script';

/** The Wistia custom embed used for the main VSL, same snippet as the GHL custom code. */
export default function WistiaEmbed({ mediaId }) {
  return (
    <>
      <Script src="https://fast.wistia.com/player.js" strategy="afterInteractive" />
      <Script src={`https://fast.wistia.com/embed/${mediaId}.js`} type="module" strategy="afterInteractive" />
      <style>{`wistia-player[media-id='${mediaId}']:not(:defined) { background: center / contain no-repeat url('https://fast.wistia.com/embed/medias/${mediaId}/swatch'); display: block; filter: blur(5px); padding-top:56.25%; }`}</style>
      <wistia-player media-id={mediaId} aspect="1.7777777777777777"></wistia-player>
    </>
  );
}
