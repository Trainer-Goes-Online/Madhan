'use client';

import { useState } from 'react';

/** GHL YouTube / Wistia link video: thumbnail figure, swapped for the iframe on click (or straight away when autoplay is on). */
export default function EmbedVideo({ className, thumbnail, embedUrl, autoPlay = false }) {
  const [playing, setPlaying] = useState(autoPlay);

  return (
    <figure className={className} data-v-fc8a25e0="">
      {playing ? (
        <div className="iframe-container" style={{ paddingBottom: '56.25%' }} data-v-fc8a25e0="">
          <iframe
            src={embedUrl}
            title="Video"
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            allowFullScreen
            data-v-fc8a25e0=""
          ></iframe>
        </div>
      ) : (
        <span className="w-100" data-v-fc8a25e0="" role="button" tabIndex={0} aria-label="Play video" onClick={() => setPlaying(true)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setPlaying(true)}>
          <div
            style={{ backgroundImage: `url(${thumbnail})`, backgroundSize: 'cover', backgroundPosition: 'center', paddingBottom: '56.25%' }}
            className="w-100"
            data-v-fc8a25e0=""
          ></div>
        </span>
      )}
    </figure>
  );
}
