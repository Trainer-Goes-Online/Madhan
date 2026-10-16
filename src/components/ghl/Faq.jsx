'use client';

import { useState } from 'react';

/** GHL FAQ element (separated style). Every item toggles on its own, like the original. */
export default function Faq({ className, items }) {
  const [openSet, setOpenSet] = useState(() => new Set());

  const toggle = (i) =>
    setOpenSet((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <div className={className}>
      {items.map((item, i) => {
        const isOpen = openSet.has(i);
        return (
          <div key={i} className={`faq-separated-child hl-faq-child${isOpen ? ' active' : ''}`}>
            <div
              className={`hl-faq-child-heading${isOpen ? ' active' : ''}`}
              role="button"
              tabIndex={0}
              aria-expanded={isOpen}
              onClick={() => toggle(i)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), toggle(i))}
            >
              <div className="hl-faq-child-head">
                <span className="hl-faq-child-heading-text">{item.q}</span>
              </div>
              <i className="hl-faq-child-heading-icon right fa"></i>
            </div>
            <div style={isOpen ? undefined : { height: 0, padding: 0, opacity: 0 }} className="hl-faq-child-panel">
              <span className="hl-faq-child-item-text item-text">{item.a}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
