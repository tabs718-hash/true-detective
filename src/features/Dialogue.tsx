import { useEffect, useState } from 'react';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { actions, characters } from '../engine/case';
import { actionCharacters, actionLabels, cardTitle, presentationReaction, speakerNames } from '../cases/chuzhoe-alibi/content';
import type { TranscriptLine } from '../engine/types';
import { dialogueAdvance } from '../ui/dialogue-controls';
import { Modal } from '../ui/Modal';
import { portraitFor } from '../cases/chuzhoe-alibi/portraits';
import { Portrait } from '../ui/Portrait';
import type { SoundEvent } from '../ui/sound-design';

interface Props {
  id: string;
  lines: TranscriptLine[];
  cardIds: string[];
  speed: number;
  readOnly?: boolean;
  onComplete: (lines: TranscriptLine[]) => void;
  onClose: () => void;
  onSound?: (event: SoundEvent) => void;
}

export function Dialogue({ id, lines, cardIds, speed, readOnly = false, onComplete, onClose, onSound }: Props) {
  const [index, setIndex] = useState(0);
  const [all, setAll] = useState(readOnly);
  const [letters, setLetters] = useState(speed === 0 ? lines[0].text.length : 0);
  const [shownCard, setShownCard] = useState('');
  const [reaction, setReaction] = useState('');
  const [presentations, setPresentations] = useState<TranscriptLine[]>([]);
  const line = lines[index];
  const char = actionCharacters[id] ?? 'COLLEAGUE';
  const personName = id === 'A_GAS' ? 'Кассир' : characters[char]?.name ?? 'Собеседник';
  const title = actionLabels[id] ?? actions[id].label;
  const portrait = portraitFor(id, all ? 0 : index, !!reaction);

  useEffect(() => {
    setLetters(speed === 0 || all ? line.text.length : 0);
    if (speed === 0 || all) return;
    const interval = setInterval(() => setLetters(previous => {
      const next = Math.min(previous + 3 * speed, line.text.length);
      if (next === line.text.length) clearInterval(interval);
      return next;
    }), 20);
    return () => clearInterval(interval);
  }, [index, speed, all, line.text]);

  const advance = dialogueAdvance({readOnly, all, last: index === lines.length - 1, typing: letters < line.text.length});

  function present() {
    onSound?.('paper');
    const text = presentationReaction(char, shownCard);
    setReaction(text);
    setPresentations(previous => [...previous,
      { speaker: 'D', text: 'Предъявленный материал: ' + cardTitle(shownCard) },
      { speaker: personName, text }
    ]);
  }

  return <Modal title={(readOnly ? 'Протокол: ' : '') + title} onClose={onClose} wide>
    <div className="dialogue-layout">
      <div className="dialogue-portrait">
        <Portrait key={portrait.source} character={portrait.character} emotion={portrait.emotion} className="emotional-portrait" alt={personName}/>
        <span>{personName}</span>
      </div>
      <div className="dialogue-body">
        {readOnly && <p className="transcript-caption">Записано при проведении беседы. Новые находки не меняют прежние показания.</p>}
        {all ? <div className="dialogue-transcript">
          {lines.map((entry, i) => <div key={i}>
            <span className="eyebrow">{speakerNames[entry.speaker] ?? entry.speaker}</span>
            <p>{entry.text}</p>
          </div>)}
        </div> : <div className="spoken-line">
          <MessageCircle size={23} strokeWidth={1}/>
          <span className="eyebrow">{speakerNames[line.speaker] ?? line.speaker}</span>
          <p>{line.text.slice(0, letters)}{letters < line.text.length && <span className="typing-caret"/>}</p>
        </div>}
        {!readOnly && cardIds.length > 0 && <div className="evidence-presentation">
          <label>Предъявить материал
            <select aria-label="Предъявляемая карточка" value={shownCard} onChange={e => { setShownCard(e.target.value); setReaction(''); }}>
              <option value="">Выберите из архива…</option>
              {cardIds.map(card => <option key={card} value={card}>{cardTitle(card)}</option>)}
            </select>
          </label>
          <button className="secondary" disabled={!shownCard} onClick={present}>Предъявить</button>
          {reaction && <p role="status">{reaction}</p>}
        </div>}
        <div className="dialogue-controls">
          {!readOnly && <button className="text-button" onClick={() => setAll(!all)}>{all ? 'По одной реплике' : 'Прочитать разговор целиком'}</button>}
          <button className="primary" onClick={() => {
            if (advance === 'close') onClose();
            else if (advance === 'reveal') setLetters(line.text.length);
            else if (advance === 'finish') onComplete([...lines, ...presentations]);
            else { setLetters(speed === 0 ? lines[index + 1].text.length : 0); setIndex(index + 1); }
          }}>{advance === 'close' ? 'Закрыть протокол' : advance === 'reveal' ? 'Показать реплику' : advance === 'finish' ? 'Закончить разговор' : 'Продолжить'}<ArrowRight size={17}/></button>
        </div>
      </div>
    </div>
  </Modal>;
}
