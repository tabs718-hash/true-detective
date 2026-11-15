import type { GameState } from '../engine/types';

type Props = { game: GameState; width: number; height: number; onItem: (id: string) => void };

// SVG slice and the background's object-fit:cover use the same image coordinates.
// The native buttons remain keyboard accessible inside foreignObject.
export function SceneEvidence({ game, width, height, onItem }: Props) {
  const stairs = game.location === 'CONSTRUCTION' && game.room === 'stairs';
  const bedroom = game.location === 'NORA_PRIVATE' && game.room === 'bedroom';
  if (!stairs && !bedroom) return null;
  return <svg className="scene-evidence" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice" role="group" aria-label="Предметы для осмотра">
    {stairs && !game.collectedCards.includes('E_WRENCH') && <foreignObject x={width * .63} y={height * .73} width={width * .07} height={width * .035}>
      <button className="physical-object wrench-object" aria-label="Осмотреть металлический предмет у лестницы" onClick={() => onItem('wrench')}><svg viewBox="0 0 100 40" aria-hidden="true"><path d="M7 20l12-12 8 2 4 9 48 1 6-8 10 2-2 12-12 7-8-7-43-1-9 8-11-3z" fill="#899088" stroke="#c0c0a9" strokeWidth="2"/><ellipse cx="86" cy="21" rx="5" ry="4" fill="#354039"/><path d="M22 14l6 8 13 0" stroke="#51382c" strokeWidth="4"/></svg></button>
    </foreignObject>}
    {stairs && !game.collectedCards.includes('E_BUTTON') && <foreignObject x={width * .8} y={height * .82} width={width * .032} height={width * .032}>
      <button className="physical-object button-object" aria-label="Осмотреть небольшой предмет среди мусора" onClick={() => onItem('button')}><svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="10" fill="#423a2c" stroke="#9b8b65" strokeWidth="1.8"/><circle cx="13" cy="13" r="1.2" fill="#161c18"/><circle cx="19" cy="13" r="1.2" fill="#161c18"/><circle cx="13" cy="19" r="1.2" fill="#161c18"/><circle cx="19" cy="19" r="1.2" fill="#161c18"/></svg></button>
    </foreignObject>}
    {bedroom && !game.collectedCards.includes('E_COAT') && <foreignObject x={width * .515} y={height * .307} width={width * .225} height={width * .225 * 260 / 180}>
      <button className="physical-object coat-object" aria-label="Осмотреть пальто на стуле" onClick={() => onItem('coat')}><svg viewBox="0 0 180 260" aria-hidden="true"><path d="M40 30L65 14 90 22 115 14 140 30 167 115 141 129 132 93 143 239 38 239 48 93 36 130 12 115Z" fill="#29332f" stroke="#82785e" strokeWidth="2"/><path d="M65 14L91 69 115 14M90 68L90 239" fill="none" stroke="#a49a78" strokeWidth="2"/><circle cx="101" cy="85" r="4" fill="#514236"/><circle cx="101" cy="143" r="4" fill="#514236"/><circle cx="101" cy="178" r="4" fill="#514236"/><path d="M97 110l8 5m-6-8l3 11m-7-5l11-1" stroke="#a4987c" strokeWidth=".8"/></svg></button>
    </foreignObject>}
  </svg>;
}
