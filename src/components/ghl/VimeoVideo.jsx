'use client';

import { useEffect, useRef, useState } from 'react';

const SoundOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M0.63 0.635029C0.24 1.02503 0.24 1.65503 0.63 2.04503L4.29 5.70503L4 6.00503H1C0.45 6.00503 0 6.45503 0 7.00503V11.005C0 11.555 0.45 12.005 1 12.005H4L7.29 15.295C7.92 15.925 9 15.475 9 14.585V10.415L13.18 14.595C12.69 14.965 12.16 15.275 11.58 15.505C11.22 15.655 11 16.035 11 16.425C11 17.145 11.73 17.605 12.39 17.335C13.19 17.005 13.94 16.565 14.61 16.025L15.95 17.365C16.34 17.755 16.97 17.755 17.36 17.365C17.75 16.975 17.75 16.345 17.36 15.955L2.05 0.635029C1.66 0.245029 1.03 0.245029 0.63 0.635029ZM16 9.00503C16 9.82503 15.85 10.615 15.59 11.345L17.12 12.875C17.68 11.705 18 10.395 18 9.00503C18 5.17503 15.6 1.89503 12.22 0.605029C11.63 0.375029 11 0.835029 11 1.46503V1.65503C11 2.03503 11.25 2.36503 11.61 2.50503C14.18 3.54503 16 6.06503 16 9.00503ZM7.29 2.71503L7.12 2.88503L9 4.76503V3.41503C9 2.52503 7.92 2.08503 7.29 2.71503ZM13.5 9.00503C13.5 7.23503 12.48 5.71503 11 4.97503V6.76503L13.48 9.24503C13.49 9.16503 13.5 9.08503 13.5 9.00503Z"
      fill="#fff"
    ></path>
  </svg>
);

/**
 * Vimeo-hosted video in place of the GHL hosted video: thumbnail (page CSS class thumbnail-<id>) until it
 * scrolls into view, then the Vimeo player autoplays muted with an "Enable sound" button, like the original.
 * `src` is the player URL (https://player.vimeo.com/video/<id>). Vimeo analytics stay on (no dnt param).
 * `ratio` is height / width of the video.
 */
export default function VimeoVideo({ id, className, src, ratio = 9 / 16 }) {
  const boxRef = useRef(null);
  const frameRef = useRef(null);
  const [inView, setInView] = useState(false);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const el = boxRef.current;
    if (!el || !src) return undefined;
    if (!('IntersectionObserver' in window)) {
      setInView(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: '200px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [src]);

  const playerUrl = (() => {
    if (!src) return '';
    const url = new URL(src);
    url.searchParams.set('autoplay', '1');
    url.searchParams.set('muted', '1');
    url.searchParams.set('playsinline', '1');
    url.searchParams.set('title', '0');
    url.searchParams.set('byline', '0');
    url.searchParams.set('portrait', '0');
    return url.toString();
  })();

  // Vimeo player postMessage API: unmute and keep playing.
  const enableSound = () => {
    const win = frameRef.current?.contentWindow;
    if (!win) return;
    const send = (method, value) => win.postMessage(JSON.stringify(value === undefined ? { method } : { method, value }), 'https://player.vimeo.com');
    send('setMuted', false);
    send('setVolume', 1);
    send('play');
    setMuted(false);
  };

  return (
    <div className={className} data-v-fc8a25e0="">
      <div className="h-100 w-100">
        <div ref={boxRef} style={{ position: 'relative', width: '100%', paddingBottom: `${ratio * 100}%` }}>
          <div
            className={`hosted-video-thumbnail thumbnail-${id} h-100 w-100`}
            style={{ position: 'absolute', inset: 0, backgroundSize: 'cover', backgroundPosition: '50%' }}
            onClick={src ? () => setInView(true) : undefined}
          ></div>
          {src && inView && (
            <iframe
              ref={frameRef}
              src={playerUrl}
              title="Video"
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
              allowFullScreen
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0, background: '#000' }}
            ></iframe>
          )}
          {src && inView && muted && (
            <button className="enable-sound-button flex align-center text-white font-medium" type="button" onClick={enableSound}>
              <span className="enable-sound-icon" aria-hidden="true">
                <SoundOffIcon />
              </span>
              <span className="enable-sound-label text-white font-medium">Enable sound</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
