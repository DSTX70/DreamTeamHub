import * as React from 'react';

async function fetchAlt(imageKey: string, locale='en') {
  const res = await fetch(`/api/seo/alt?key=${encodeURIComponent(imageKey)}&locale=${locale}`);
  if (!res.ok) return null;
  const j = await res.json();
  return j.alt as string | null;
}

type Props = {
  baseKey: string;     // e.g. "fcc/lifestyle/OL-1_Brunch_Banter_SKU-OL-PRIDE-001"
  ext?: 'webp' | 'avif'; // default webp
  className?: string;
  lqipSrc?: string;    // optional tiny 480w blur image
};

export default function PictureBanner({ baseKey, ext='webp', className='', lqipSrc }: Props) {
  const [alt, setAlt] = React.useState<string>('');
  const mk = (w:number,h:number) => `/${baseKey}_${w}x${h}.${ext}`;
  const imageKeyDesktop = `${baseKey}_1920x800.${ext}`; // used for alt lookup

  React.useEffect(() => { (async () => {
    const a = await fetchAlt(imageKeyDesktop.replace(/^\//,'')) || '';
    setAlt(a);
  })(); }, [imageKeyDesktop]);

  // until assets land, show a soft placeholder
  const [exists, setExists] = React.useState<boolean | null>(null);
  React.useEffect(() => {
    fetch(mk(1920,800), { method:'HEAD' }).then(r => setExists(r.ok)).catch(()=>setExists(false));
  }, [baseKey, ext]);

  if (exists === false) {
    return (
      <div className={`w-full h-[320px] md:h-[380px] lg:h-[400px] bg-neutral-200/50 border border-dashed rounded-card grid place-items-center ${className}`}>
        <div className="text-sm text-neutral-500">Lifestyle banner pending upload</div>
      </div>
    );
  }

  return (
    <picture className={className}>
      {/* Desktop ≥1024px: 1920x800 (2x: 3840x1600) */}
      <source media="(min-width:1024px)" srcSet={`${mk(1920,800)} 1x, ${mk(3840,1600)} 2x`} type={`image/${ext}`} />
      {/* Tablet ≥640px: 960x600 */}
      <source media="(min-width:640px)" srcSet={mk(960,600)} type={`image/${ext}`} />
      {/* Mobile default: 1080x1350 */}
      <img
        src={mk(1080,1350)}
        alt={alt || ''}
        className="w-full h-auto block"
        loading="lazy"
        {...(lqipSrc ? { style:{ background:`url(${lqipSrc}) center/cover no-repeat` } } : {})}
      />
    </picture>
  );
}
