import * as React from 'react';

export default function BrandScope({ 
  brand = 'fcc', 
  children 
}: {
  brand?: 'fcc' | 'default';
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    const prev = document.documentElement.getAttribute('data-brand');
    if (brand) {
      document.documentElement.setAttribute('data-brand', brand);
    }
    return () => {
      if (prev) {
        document.documentElement.setAttribute('data-brand', prev);
      } else {
        document.documentElement.removeAttribute('data-brand');
      }
    };
  }, [brand]);
  
  return <>{children}</>;
}
