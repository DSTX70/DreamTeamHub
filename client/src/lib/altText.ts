/**
 * Alt Text Helper Functions
 * For retrieving SEO alt text from the registry
 */

import React from 'react';
import type { AltText } from '@shared/schema';

/**
 * Retrieves alt text for an image from the registry
 * @param imageKey - The image key/filename/path
 * @param locale - The locale (defaults to 'en')
 * @returns Promise<string> - The alt text or empty string if not found
 */
export async function getAlt(imageKey: string, locale: string = 'en'): Promise<string> {
  try {
    const response = await fetch(`/api/seo/alt-text?image_key=${encodeURIComponent(imageKey)}&locale=${encodeURIComponent(locale)}`);
    
    if (!response.ok) {
      console.warn(`[getAlt] Alt text not found for ${imageKey} (${locale})`);
      return '';
    }

    const data = await response.json();
    return data.altText?.altText || '';
  } catch (error) {
    console.error(`[getAlt] Error fetching alt text for ${imageKey}:`, error);
    return '';
  }
}

/**
 * Retrieves full alt text entry with metadata
 * @param imageKey - The image key/filename/path
 * @param locale - The locale (defaults to 'en')
 * @returns Promise<AltText | null> - The full alt text entry or null if not found
 */
export async function getAltEntry(imageKey: string, locale: string = 'en'): Promise<AltText | null> {
  try {
    const response = await fetch(`/api/seo/alt-text?image_key=${encodeURIComponent(imageKey)}&locale=${encodeURIComponent(locale)}`);
    
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.altText || null;
  } catch (error) {
    console.error(`[getAltEntry] Error fetching alt text entry for ${imageKey}:`, error);
    return null;
  }
}

/**
 * React hook for fetching alt text
 * @param imageKey - The image key/filename/path
 * @param locale - The locale (defaults to 'en')
 * @returns Object with altText string and loading state
 */
export function useAltText(imageKey: string | undefined, locale: string = 'en') {
  const [altText, setAltText] = React.useState<string>('');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!imageKey) {
      setAltText('');
      return;
    }

    let mounted = true;
    setLoading(true);

    getAlt(imageKey, locale)
      .then((text) => {
        if (mounted) {
          setAltText(text);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setAltText('');
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [imageKey, locale]);

  return { altText, loading };
}
