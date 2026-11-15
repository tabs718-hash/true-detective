import { BookOpen, Pin } from 'lucide-react';
import type { PointerEvent, MouseEvent } from 'react';
import type { BoardNode } from '../engine/types';
import { cards } from '../engine/case';
import { cardTitle, typeSingular } from '../cases/chuzhoe-alibi/content';

type Props = {
  node: BoardNode;
  selected: boolean;
  onRead: (id:string)=>void;
  onMove: (dx:number,dy:number)=>void;
  onPin: ()=>void;
  onDrag: (event:PointerEvent<HTMLElement>)=>void;
  onContext: (event:MouseEvent<HTMLElement>)=>void;
};

export function BoardCard({node,selected,onRead,onMove,onPin,onDrag,onContext}:Props) {
  const card=cards[node.cardId];
  return <article className={'pinned-card '+(selected?'pin-selected':'')} style={{left:node.x,top:node.y}} tabIndex={0} aria-label={'Карточка: '+cardTitle(node.cardId)} onKeyDown={event=>{
    if(event.target!==event.currentTarget)return;
    const steps:Record<string,[number,number]>={ArrowLeft:[-10,0],ArrowRight:[10,0],ArrowUp:[0,-10],ArrowDown:[0,10]};
    const step=steps[event.key];
    if(step){event.preventDefault();event.stopPropagation();onMove(...step);}
  }} onPointerDown={event=>{
    if((event.target as HTMLElement).closest('button'))return;
    onDrag(event);
  }} onContextMenu={onContext}>
    <button className="pin" aria-label={'Соединить нитью: '+cardTitle(node.cardId)} onClick={onPin}><Pin size={14}/></button>
    <span className="card-kind">{typeSingular[card.type]}</span><h3>{cardTitle(node.cardId)}</h3>
    <p>{card.summary.slice(0,115)}{card.summary.length>115?'…':''}</p>
    <button className="card-read" aria-label={'Прочитать карточку: '+cardTitle(node.cardId)} onClick={()=>onRead(node.cardId)}><BookOpen size={12}/>Читать целиком</button>
  </article>;
}
