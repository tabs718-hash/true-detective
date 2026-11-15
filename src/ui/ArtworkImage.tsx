import { useState } from 'react';

export function ArtworkUnavailable({ alt, className, label = 'Изображение временно недоступно' }: { alt: string; className?: string; label?: string }) {
  return <div className={'artwork-unavailable ' + (className ?? '')} role="img" aria-label={alt + ' — изображение недоступно'}><span>{label}</span></div>;
}

export function ArtworkImage({ src, alt, className, onDimensions, unavailableLabel }: { src: string; alt: string; className?: string; onDimensions?: (width: number, height: number) => void; unavailableLabel?: string }) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  if (!src || failedSource === src) return <ArtworkUnavailable alt={alt} className={className} label={unavailableLabel}/>;
  return <img src={src} className={className} alt={alt} draggable={false} onError={() => setFailedSource(src)} onLoad={event => onDimensions?.(event.currentTarget.naturalWidth, event.currentTarget.naturalHeight)}/>;
}
