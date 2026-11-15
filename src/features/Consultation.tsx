import { FileText, Scale } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { characters } from '../engine/case';
import type { ConsultationRecord } from '../engine/types';
import { cardTitle } from '../cases/chuzhoe-alibi/content';

export function Consultation({ record, onClose }: { record: ConsultationRecord; onClose: () => void }) {
  return <Modal title="Замечания прокурора" onClose={onClose} wide>
    <div className="consultation-layout">
      <aside>
        <img src="/assets/portraits/prosecutor.svg" alt="Прокурор округа Кук"/>
        <span className="eyebrow">Пакет на момент консультации</span>
        <h3>{characters[record.packet.defendant]?.name ?? 'Обвиняемый'}</h3>
        <p>Приложено: {record.packet.selectedCardIds.length}</p>
        <ul>{record.packet.selectedCardIds.map(id => <li key={id}><FileText size={12}/>{cardTitle(id)}</li>)}</ul>
      </aside>
      <div className="consultation-notes">
        {record.lines.map((line, i) => <article key={i}><span className="eyebrow">{line.speaker}</span><p>{line.text}</p></article>)}
        <p className="quiet-note">Это запись состоявшейся консультации. Изменение пакета не меняет прежние замечания.</p>
        <button className="primary" onClick={onClose}><Scale size={16}/>Продолжить расследование</button>
      </div>
    </div>
  </Modal>;
}
