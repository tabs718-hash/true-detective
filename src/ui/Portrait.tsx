import { assetUrl } from './asset-url';
import { useState } from 'react';
import { UserRound } from 'lucide-react';
import { portraitResource, type PortraitEmotion } from '../cases/chuzhoe-alibi/portraits';

export function Portrait({ character, emotion = 'neutral', alt, className }: { character: string; emotion?: PortraitEmotion; alt: string; className?: string }) {
  const [failedSources, setFailedSources] = useState<string[]>([]);
  const source = portraitResource(character, emotion).sources.find(candidate => !failedSources.includes(candidate));
  if (!source) return <div className={'portrait-unavailable ' + (className ?? '')} role="img" aria-label={alt + ' — портрет недоступен'}><UserRound size={46} strokeWidth={1}/></div>;
  return <img key={source} className={className} src={assetUrl(source)} alt={alt} onError={() => setFailedSources(previous => previous.includes(source) ? previous : [...previous, source])}/>;
}
