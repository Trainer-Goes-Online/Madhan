'use client';

import { useEffect } from 'react';
import { captureAttribution } from '@/lib/tracking';

/** Captures UTMs / fbclid / ad IDs and keeps _fbc in sync on every page load. */
export default function TrackingInit() {
  useEffect(() => {
    captureAttribution();
  }, []);
  return null;
}
