import { sceneArt } from '../cases/chuzhoe-alibi/art';
import { ArtworkImage } from './ArtworkImage';

export function SceneBackground({ art, className, onDimensions }: { art: string; className?: string; onDimensions?: (width: number, height: number) => void }) {
  const image = sceneArt(art);
  return <ArtworkImage src={image.src} className={className} alt={image.alt} onDimensions={onDimensions}/>;
}
