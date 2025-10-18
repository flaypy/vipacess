'use client';

import { useEffect } from 'react';
import { initPlausible } from '@/lib/analytics';

export default function PlausibleProvider() {
  useEffect(() => {
    // Initialize Plausible tracker once on mount
    // This will enable automatic pageview tracking
    initPlausible();
  }, []);

  // This component doesn't render anything
  return null;
}
