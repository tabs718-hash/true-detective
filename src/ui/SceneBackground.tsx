import { useState } from 'react';
import { sceneArt } from '../cases/chuzhoe-alibi/art';

export function SceneBackground({ art, className, onDimensions }: { art: string; className?: string; onDimensions?: (width: number, height: number) => void }) {
  const image = sceneArt(art);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const fallback = failedSource === image.src;
  return <img
    className={className}
    src={fallback ? image.fallback : image.src}
    alt={fallback ? 'Сценографический эскиз помещения эпохи 1960-х годов' : image.alt}
    draggable={false}
    onLoad={event => onDimensions?.(event.currentTarget.naturalWidth, event.currentTarget.naturalHeight)}
    onError={fallback || image.src === image.fallback ? undefined : () => setFailedSource(image.src)}
  />;
}
