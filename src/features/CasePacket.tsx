import { useState } from 'react';
import { Check, Circle, Scale, Send, ArrowUpRight, Search, X, BookOpen } from 'lucide-react';
import { cards, characters } from '../engine/case';
import { knownCharacters } from '../engine/engine';
import type { GameState, CasePacket as Packet } from '../engine/types';
import { cardTitle, typeNames, typeSingular } from '../cases/chuzhoe-alibi/content';
import { packetFields } from '../cases/chuzhoe-alibi/packet';

export function CasePacket({ game, onChange, onSubmit, onProsecutor, onConsultationNotes }: {
  game: GameState;
  onChange: (packet: Packet) => void;
  onSubmit: () => void;
  onProsecutor: () => void;
  onConsultationNotes: () => void;
}) {
  const selected = game.casePacket.selectedCardIds;
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const fields = packetFields(game.casePacket);
  const visible = game.collectedCards.filter(id => (type === 'all' || cards[id].type === type) && (cardTitle(id) + ' ' + cards[id].summary).toLowerCase().includes(query.toLowerCase()));
  return <section className="paper-page">
    <div className="page-heading"><div><span className="eyebrow">Ответственность за выбранную версию</span><h1>Оформление дела</h1><p>Архив — всё, что вы нашли. Пакет — только то, что вы решите предъявить.</p></div><Scale size={45} strokeWidth={1}/></div>
    <div className="packet-layout"><div>
      <label className="field-label">Обвиняемый<select aria-label="Обвиняемый" value={game.casePacket.defendant} onChange={event => onChange({ ...game.casePacket, defendant: event.target.value })}><option value="">Выберите известного персонажа</option>{knownCharacters(game).map(character => <option key={character.id} value={character.id}>{character.name}</option>)}</select></label>
      <div className="packet-selection"><h2>Приложить материалы вручную</h2>
        <div className="packet-tools"><label className="search-field"><Search size={15}/><input aria-label="Поиск материалов для пакета" placeholder="Найти карточку" value={query} onChange={event => setQuery(event.target.value)}/></label><select aria-label="Тип материалов пакета" value={type} onChange={event => setType(event.target.value)}><option value="all">Все типы</option>{Object.entries(typeNames).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></div>
        {visible.map(id => <label key={id} className={'packet-card ' + (selected.includes(id) ? 'selected' : '')}><input type="checkbox" checked={selected.includes(id)} onChange={event => onChange({ ...game.casePacket, selectedCardIds: event.target.checked ? [...selected, id] : selected.filter(card => card !== id) })}/><span><small>{typeSingular[cards[id].type]}</small>{cardTitle(id)}</span>{selected.includes(id) && <Check size={17}/>}</label>)}
        {!visible.length && <p className="muted">{game.collectedCards.length ? 'По этому запросу карточек нет.' : 'В архиве пока нет материалов.'}</p>}
      </div>
    </div><aside className="packet-summary">
      <span className="eyebrow">Сводка выбранного пакета</span><h2>{characters[game.casePacket.defendant]?.name ?? 'Обвиняемый не выбран'}</h2><p>Приложено: {selected.length}</p>
      <div className="packet-fields">{fields.map(field => <div key={field.id}>{field.cardIds.length ? <Check size={16}/> : <Circle size={14}/>}<span>{field.label}</span><small>{field.cardIds.length ? 'Есть материалы' : 'Не заполнено'}</small></div>)}</div>
      <p className="quiet-note">Заполненное поле означает наличие карточек по теме. Это не оценка их истинности и не гарантия приговора.</p>
      {selected.length > 0 && <details className="packet-selected-list"><summary>Просмотреть приложения</summary>{selected.map(id => <div key={id}><span>{cardTitle(id)}</span><button className="icon-button" aria-label={'Убрать из пакета: ' + cardTitle(id)} onClick={() => onChange({ ...game.casePacket, selectedCardIds: selected.filter(card => card !== id) })}><X size={13}/></button></div>)}</details>}
      {game.consultationRecord && <button className="secondary full" onClick={onConsultationNotes}><BookOpen size={16}/>Замечания прокурора</button>}
      <button className="secondary full" disabled={game.consultationUsed || !game.casePacket.defendant} onClick={onProsecutor}><Scale size={17}/>{game.consultationUsed ? 'Консультация использована' : 'Отправиться к прокурору'}<ArrowUpRight size={15}/></button>
      <button className="primary full" disabled={!game.casePacket.defendant} onClick={onSubmit}><Send size={17}/>Проверить и передать дело</button>
      <p className="irreversible-note">После окончательного подтверждения вернуться к расследованию и загрузить сохранение нельзя.</p>
    </aside></div>
  </section>;
}
