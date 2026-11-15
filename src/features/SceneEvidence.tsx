import type { GameState } from '../engine/types';
import { sceneItemArt } from '../cases/chuzhoe-alibi/items';
import { ArtworkImage } from '../ui/ArtworkImage';

type Props = { game: GameState; width: number; height: number; onItem: (id: string) => void };

// SVG slice and the background's object-fit:cover use the same image coordinates.
// The native buttons remain keyboard accessible inside foreignObject.
export function SceneEvidence({ game, width, height, onItem }: Props) {
  const stairs = game.location === 'CONSTRUCTION' && game.room === 'stairs';
  const bedroom = game.location === 'NORA_PRIVATE' && game.room === 'bedroom';
  if (!stairs && !bedroom) return null;
  return <svg className="scene-evidence" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice" role="group" aria-label="Предметы для осмотра">
    {stairs && !game.collectedCards.includes('E_WRENCH') && <foreignObject x={width * .63} y={height * .73} width={width * .07} height={width * .035}>
      <button className="physical-object wrench-object" aria-label="Осмотреть металлический предмет у лестницы" onClick={() => onItem('wrench')}><ArtworkImage src={sceneItemArt.wrench.src} className="scene-item-sprite" alt="" unavailableLabel="?"/></button>
    </foreignObject>}
    {stairs && !game.collectedCards.includes('E_BUTTON') && <foreignObject x={width * .8} y={height * .82} width={width * .032} height={width * .032}>
      <button className="physical-object button-object" aria-label="Осмотреть небольшой предмет среди мусора" onClick={() => onItem('button')}><ArtworkImage src={sceneItemArt.button.src} className="scene-item-sprite" alt="" unavailableLabel="?"/></button>
    </foreignObject>}
    {bedroom && !game.collectedCards.includes('E_COAT') && <foreignObject x={width * .515} y={height * .29} width={width * .225} height={width * .225 * sceneItemArt.coat.height / sceneItemArt.coat.width}>
      <button className="physical-object coat-object" aria-label="Осмотреть пальто на стуле" onClick={() => onItem('coat')}><ArtworkImage src={sceneItemArt.coat.src} className="scene-item-sprite" alt="" unavailableLabel="?"/></button>
    </foreignObject>}
  </svg>;
}
