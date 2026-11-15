import { useState } from 'react';
import { ArrowLeft, ArrowRight, Search, ZoomIn } from 'lucide-react';
import { ItemArtwork, type ItemKind } from '../ui/ItemArtwork';
import { Modal } from '../ui/Modal';
import { itemDescriptions } from '../cases/chuzhoe-alibi/content';

const details: Record<ItemKind, { label: string; text: string }[]> = {
  button: [
    { label: 'Изнанка и нити', text: 'В отверстиях и у края застряли светлые обрывки нити. Один конец неровный. Это наблюдение, а не заключение о происхождении предмета.' },
    { label: 'Отделка края', text: 'По ободку проходит тонкая декоративная канавка. На тёмной поверхности заметны потёртости и небольшой дефект отделки.' }
  ],
  wrench: [
    { label: 'Рукоять', text: 'На металле видны следы захвата. Установить их принадлежность одним осмотром нельзя.' },
    { label: 'Бурые брызги', text: 'Небольшие пятна на головке и возле рукояти. Само их присутствие ещё не определяет, как использовали ключ.' }
  ],
  coat: [
    { label: 'Повреждённое крепление', text: 'На месте одной пуговицы остались короткие нити. Несколько волокон ткани вытянуты, словно крепление испытало натяжение.' },
    { label: 'Ткань и отделка', text: 'Плотная тёмная ткань, машинные швы и сохранившиеся застёжки. Обстоятельства повреждения по одному виду пальто не установить.' }
  ]
};

export function ItemInspection({ kind, collected = false, onCollect, onClose }: { kind: ItemKind; collected?: boolean; onCollect?: () => void; onClose: () => void }) {
  const [detail, setDetail] = useState<number | null>(null);
  const item = itemDescriptions[kind];
  return <Modal title={item.title} onClose={onClose} wide>
    <div className="inspection-layout">
      <div className="inspection-picture">
        <ItemArtwork kind={kind} detail={detail !== null}/>
        <span className="inspection-view-label">{detail === null ? 'Общий вид' : details[kind][detail].label}</span>
        {detail !== null && <button className="inspection-reset" onClick={() => setDetail(null)}><ArrowLeft size={14}/>Общий вид</button>}
      </div>
      <div className="inspection-notes">
        <span className="eyebrow"><Search size={12}/>Детальный осмотр</span>
        <p>{detail === null ? item.text : details[kind][detail].text}</p>
        <div className="inspection-points">{details[kind].map((point, i) => <button key={point.label} className={detail === i ? 'active' : ''} onClick={() => setDetail(i)}><ZoomIn size={15}/>{point.label}<ArrowRight size={13}/></button>)}</div>
        <p className="quiet-note">{collected ? 'Предмет находится в архиве дела.' : 'Предмет остаётся на месте до отдельного изъятия.'}</p>
      </div>
    </div>
    <div className="modal-actions">
      <button className="secondary" onClick={onClose}>{collected ? 'Закрыть осмотр' : 'Оставить на месте'}</button>
      {!collected && onCollect && <button className="primary" onClick={onCollect}>Изъять в дело<ArrowRight size={17}/></button>}
    </div>
  </Modal>;
}
