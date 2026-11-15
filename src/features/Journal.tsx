import { useState } from 'react';
import { BookOpen, Check, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import type { GameState } from '../engine/types';
import { addNote, editNote, removeNote } from '../engine/notebook';

export function Journal({ game, onChange, notice }: { game: GameState; onChange: (state: GameState) => void; notice: (message: string) => void }) {
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [tab, setTab] = useState<'notes' | 'events'>('notes');

  function storeNote() {
    try {
      onChange(editing ? editNote(game, editing, draft) : addNote(game, draft));
      setDraft(''); setEditing(null);
      notice('Запись добавлена в блокнот. Сохраните игру, чтобы вернуться к ней позже.');
    } catch (error) { notice((error as Error).message); }
  }

  return <section className="paper-page journal-page">
    <div className="page-heading"><div>
      <span className="eyebrow">Личные записи детектива</span>
      <h1>Журнал</h1>
      <p>Ваши наблюдения, версии и вопросы, к которым стоит вернуться.</p>
    </div><BookOpen size={42} strokeWidth={1}/></div>
    <div className="archive-tabs journal-tabs">
      <button className={tab === 'notes' ? 'active' : ''} onClick={() => setTab('notes')}><Pencil size={16}/>Мой блокнот</button>
      <button className={tab === 'events' ? 'active' : ''} onClick={() => setTab('events')}><BookOpen size={16}/>Хронология действий</button>
    </div>
    {tab === 'notes' && <div className="notebook-composer">
      <label htmlFor="note-draft">{editing ? 'Редактировать запись' : 'Новая запись'}</label>
      <textarea id="note-draft" value={draft} onChange={e => setDraft(e.target.value)} maxLength={4000} rows={4} placeholder="Что в этой истории не сходится?"/>
      <div><p className="quiet-note">Личные версии остаются в блокноте. Доказательства для суда выбираются из архива.</p>
        {editing && <button className="text-button" onClick={() => { setEditing(null); setDraft(''); }}><X size={14}/>Отмена</button>}
        <button className="primary" disabled={!draft.trim()} onClick={storeNote}>{editing ? <Check size={16}/> : <Plus size={16}/>}Записать</button>
      </div>
    </div>}
    <label className="search-field"><Search size={16}/><input aria-label="Поиск по журналу" placeholder="Найти запись" value={query} onChange={e => setQuery(e.target.value)}/></label>
    {tab === 'notes' ? <div className="personal-notes">
      {game.personalNotes.filter(note => note.text.toLowerCase().includes(query.toLowerCase())).map(note => <article key={note.id}>
        <p>{note.text}</p><div>
          <button className="icon-button" aria-label="Редактировать запись" onClick={() => { setEditing(note.id); setDraft(note.text); }}><Pencil size={15}/></button>
          <button className="icon-button" aria-label="Удалить запись" onClick={() => { onChange(removeNote(game, note.id)); if (editing === note.id) { setEditing(null); setDraft(''); } }}><Trash2 size={15}/></button>
        </div>
      </article>)}
      {!game.personalNotes.length && <div className="empty-state"><Pencil size={30}/><h2>Место для вашей версии</h2><p>Первые выводы не обязаны оказаться верными.</p></div>}
    </div> : <div className="journal-lines">
      {game.journal.filter(entry => entry.text.toLowerCase().includes(query.toLowerCase())).map((entry, i) => <article key={entry.id}><span>{String(i + 1).padStart(2, '0')}</span><p>{entry.text}</p></article>)}
    </div>}
  </section>;
}
