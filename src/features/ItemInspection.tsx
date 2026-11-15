import { useState } from 'react';
import { ArrowLeft, ArrowRight, Search, ZoomIn } from 'lucide-react';
import { ItemArtwork, type ItemKind } from '../ui/ItemArtwork';
import { Modal } from '../ui/Modal';
import { itemDescriptions } from '../cases/chuzhoe-alibi/content';

import { itemArt } from '../cases/chuzhoe-alibi/items';

export function ItemInspection({ kind, collected = false, onCollect, onClose }: { kind: ItemKind; collected?: boolean; onCollect?: () => void; onClose: () => void }) {
  const [detail, setDetail] = useState<number | null>(null);
  const item = itemDescriptions[kind];
  const details = itemArt[kind].views;
  return <Modal title={item.title} onClose={onClose} wide>
    <div className="inspection-layout">
      <div className="inspection-picture">
        <ItemArtwork kind={kind} detail={detail}/>
        <span className="inspection-view-label">{detail === null ? 'Общий вид' : details[detail].label}</span>
        {detail !== null && <button className="inspection-reset" onClick={() => setDetail(null)}><ArrowLeft size={14}/>Общий вид</button>}
      </div>
      <div className="inspection-notes">
        <span className="eyebrow"><Search size={12}/>Детальный осмотр</span>
        <p>{detail === null ? item.text : details[detail].text}</p>
        <div className="inspection-points">{details.map((point, i) => <button key={point.label} className={detail === i ? 'active' : ''} onClick={() => setDetail(i)}><ZoomIn size={15}/>{point.label}<ArrowRight size={13}/></button>)}</div>
        <p className="quiet-note">{collected ? 'Предмет находится в архиве дела.' : 'Предмет остаётся на месте до отдельного изъятия.'}</p>
      </div>
    </div>
    <div className="modal-actions">
      <button className="secondary" onClick={onClose}>{collected ? 'Закрыть осмотр' : 'Оставить на месте'}</button>
      {!collected && onCollect && <button className="primary" onClick={onCollect}>Изъять в дело<ArrowRight size={17}/></button>}
    </div>
  </Modal>;
}
