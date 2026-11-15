import { assetUrl } from './asset-url';
import { useState } from 'react';
import { itemArt, type ItemKind } from '../cases/chuzhoe-alibi/items';
import { ArtworkUnavailable } from './ArtworkImage';
export type { ItemKind } from '../cases/chuzhoe-alibi/items';

export function ItemArtwork({ kind, detail = null }: { kind: ItemKind; detail?: number | null }) {
  const art = itemArt[kind];
  const [failedSource, setFailedSource] = useState<string | null>(null);
  if (failedSource === art.src) return <ArtworkUnavailable className="item-artwork" alt={art.alt}/>;
  const view = detail === null ? undefined : art.views[detail];
  const frame = view?.frame ?? [0, 0, art.width, art.height];
  return <svg viewBox={frame.join(' ')} width={art.width} height={art.height} preserveAspectRatio="xMidYMid meet" overflow="hidden" className={'item-artwork item-artwork-' + kind} role="img" aria-label={art.alt + (view ? ' — ' + view.label : '')}>
    <image href={assetUrl(art.src)} width={art.width} height={art.height} onError={() => setFailedSource(art.src)}/>
  </svg>;
}
