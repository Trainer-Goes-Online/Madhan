'use client';

import { usePopup } from './GhlPage';

/**
 * GHL button element.
 * action: "popup" opens the page popup, "link" goes to href, "none" does nothing (the original opened an empty popup).
 */
export default function GhlButton({ id, btnClass, action = 'none', href, label, sub }) {
  const { open } = usePopup();

  const onClick = () => {
    if (action === 'popup') open();
    else if (action === 'link' && href) window.location.assign(href);
  };

  return (
    <div id={id} className={`c-button c-wrapper ${id}`}>
      <button id={`${id}_btn`} className={btnClass} aria-label={label} type="button" onClick={onClick}>
        <div className="main-heading-group">
          <div className="button-icon-start"></div>
          <div className="main-heading-button">{label}</div>
          <div className="button-icon-end"></div>
        </div>
        {sub ? (
          <div className="text-xs font-sans">
            <div className="sub-heading-button">{sub}</div>
          </div>
        ) : null}
      </button>
    </div>
  );
}
