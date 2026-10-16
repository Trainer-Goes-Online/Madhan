'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const PopupContext = createContext({ isOpen: false, open: () => {}, close: () => {} });

export const usePopup = () => useContext(PopupContext);

/** Same wrapper markup GHL renders around every funnel page, plus the popup open/close state. */
export default function GhlPage({ popup = null, children }) {
  const [isOpen, setOpen] = useState(false);
  const open = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);
  const value = useMemo(() => ({ isOpen, open, close }), [isOpen, open, close]);

  return (
    <PopupContext.Provider value={value}>
      <div className="bgCover bg-fixed"></div>
      <div>
        <div>
          <div id="preview-container" className="preview-container hl_page-preview--content">
            <div>{children}</div>
          </div>
        </div>
      </div>
      {popup}
    </PopupContext.Provider>
  );
}
