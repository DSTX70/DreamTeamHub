import { useEffect } from 'react';

interface SeoData {
  title?: string;
  description?: string;
  ogImage?: string;
  keywords?: string;
}

export function HeadHome({ seo }: { seo?: SeoData | null }) {
  useEffect(() => {
    if (!seo) return;

    // Set document title
    if (seo.title) {
      document.title = seo.title;
    }

    // Helper to update or create meta tag
    const updateMetaTag = (name: string, content: string, property = false) => {
      const attr = property ? 'property' : 'name';
      let element = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, name);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    // Set meta description
    if (seo.description) {
      updateMetaTag('description', seo.description);
    }

    // Set keywords
    if (seo.keywords) {
      updateMetaTag('keywords', seo.keywords);
    }

    // Set Open Graph tags
    if (seo.title) {
      updateMetaTag('og:title', seo.title, true);
    }
    
    if (seo.description) {
      updateMetaTag('og:description', seo.description, true);
    }
    
    if (seo.ogImage) {
      updateMetaTag('og:image', seo.ogImage, true);
    }
  }, [seo]);

  // This component doesn't render anything
  return null;
}
