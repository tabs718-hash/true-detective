import { useMemo, useRef, useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, FileText, RotateCcw, Scale } from 'lucide-react';
import type { GameState } from '../engine/types';
import { buildFinale, type FinalePhase } from '../cases/chuzhoe-alibi/court';
import { cardTitle, typeSingular } from '../cases/chuzhoe-alibi/content';
import { cards, characters } from '../engine/case';
import { saveEndingProgress } from '../persistence/save';
import { Modal } from '../ui/Modal';
import type { SoundEvent } from '../ui/sound-design';

interface Props {
  game: GameState;
  onProgress: (step: number) => void;
  onNewGame: () => void;
  notice: (message: string) => void;
  onSound?: (event: SoundEvent) => void;
  onEnvironment?: (location: string) => void;
}
const phaseNames: Record<FinalePhase, string> = { transfer: 'Дело передано', hearing: 'Рассмотрение материалов', decision: 'Решение', corridor: 'После суда', reconstruction: 'Реконструкция событий', epilogue: 'Эпилог', report: 'Итоговый отчёт' };

export function EndingPlayer({ game, onProgress, onNewGame, notice, onSound, onEnvironment }: Props) {
  const sequence = useMemo(() => buildFinale(game.casePacket, game.endingId), [game.casePacket, game.endingId]);
  const index = Math.min(game.endingProgress, sequence.scenes.length - 1);
  const scene = sequence.scenes[index];
  const final = scene.phase === 'report';
  const [busy, setBusy] = useState(false);
  const [card, setCard] = useState<string | null>(null);
  const panel = useRef<HTMLElement>(null);

  useEffect(() => { panel.current?.focus(); }, [index]);
  useEffect(() => {
    const environment = scene.phase === 'reconstruction' ? scene.id === 'truth-home' ? 'NORA_PRIVATE' : 'CONSTRUCTION' : scene.phase === 'report' ? 'POLICE' : scene.art === '/assets/mansion.svg' ? 'MANSION' : 'PROSECUTOR';
    onEnvironment?.(environment);
  }, [scene.phase, scene.id, scene.art, onEnvironment]);
  async function go(next: number) {
    if (busy || next < 0 || next >= sequence.scenes.length) return;
    setBusy(true);
    try { await saveEndingProgress(game, next); onProgress(next); onSound?.('paper'); }
    catch (error) { notice((error as Error).message); }
    finally { setBusy(false); }
  }

  return <div className={'finale-screen phase-' + scene.phase}>
    <img key={scene.art} className="finale-backdrop" src={scene.art} alt={scene.phase === 'reconstruction' ? 'Сцена реконструкции после решения суда' : 'Сцена завершения дела'}/>
    <div className="finale-shade"/>
    <header className="finale-header"><span><Scale size={20}/>ЧУЖОЕ АЛИБИ</span><span>Дело № 66–041 · {phaseNames[scene.phase]}</span></header>
    <main className={'finale-panel ' + (final ? 'finale-report' : '')} ref={panel} tabIndex={-1} aria-label={scene.title} onKeyDown={event => {
      if ((event.target as HTMLElement).closest('button, input, select, dialog, summary')) return;
      if (event.key === 'ArrowRight' && !final) { event.preventDefault(); void go(index + 1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); void go(index - 1); }
    }}>
      <span className="eyebrow">{phaseNames[scene.phase]}</span>
      <h1>{scene.title}</h1>
      {scene.speaker && <span className="finale-speaker">{scene.speaker}</span>}
      {scene.portrait && <img className="finale-portrait" src={scene.portrait} alt={scene.speaker ?? 'Участник дела'}/>}
      <div className="finale-prose">{scene.paragraphs.map((text, i) => <p key={i}>{text}</p>)}</div>
      {scene.citedCardIds.length > 0 && <details className="finale-evidence"><summary><FileText size={14}/>Материалы этой сцены</summary><div>{scene.citedCardIds.map(id => <button key={id} onClick={() => setCard(id)}>{cardTitle(id)}</button>)}</div></details>}
      {final && <>
        <div className="report-facts"><span>Обвиняемый<strong>{characters[game.casePacket.defendant]?.name ?? 'Не указан'}</strong></span><span>Приложено к делу<strong>{game.casePacket.selectedCardIds.length}</strong></span><span>Найдено уникальных карточек<strong>{new Set(game.collectedCards).size}</strong></span></div>
        <p className="finale-lock-note">Эта партия завершена. Загрузка сохранения и возврат к расследованию недоступны.</p>
        <details className="finale-evidence"><summary>Выбранный пакет</summary><div>{game.casePacket.selectedCardIds.map(id => <button key={id} onClick={() => setCard(id)}>{cardTitle(id)}</button>)}</div></details>
      </>}
      <nav className="finale-controls" aria-label="Навигация по финалу">
        <button className="secondary" disabled={busy || index === 0} onClick={() => void go(index - 1)}><ArrowLeft size={16}/>Предыдущая сцена</button>
        {final ? <button className="primary" disabled={busy} onClick={onNewGame}><RotateCcw size={16}/>Начать заново</button> : <button className="primary" disabled={busy} onClick={() => void go(index + 1)}>Продолжить<ArrowRight size={17}/></button>}
      </nav>
      {!final && <button className="finale-skip" disabled={busy} onClick={() => void go(sequence.scenes.length - 1)}>К итоговому отчёту</button>}
      {final && index > 0 && <button className="finale-skip" disabled={busy} onClick={() => void go(0)}>Пересмотреть финал</button>}
    </main>
    <footer className="finale-footer"><span>Чикаго · осень 1966</span><span>Сценографические эскизы · тестовая редакция</span></footer>
    {card && game.casePacket.selectedCardIds.includes(card) && <Modal title={cardTitle(card)} onClose={() => setCard(null)}><span className="card-kind">{typeSingular[cards[card].type]}</span><p className="detail-text">{cards[card].summary}</p><button className="primary" onClick={() => setCard(null)}>Вернуться к сцене</button></Modal>}
  </div>;
}
