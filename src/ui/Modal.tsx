import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
export function Modal({title,children,onClose,wide=false}:{title:string;children:ReactNode;onClose:()=>void;wide?:boolean}){
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const el=ref.current;if(el&&!el.open)el.showModal();return()=>el?.close()},[]);
 return <dialog ref={ref} className={'modal '+(wide?'modal-wide':'')} onCancel={e=>{e.preventDefault();onClose()}} aria-label={title}><header><div><span className="eyebrow">Чужое алиби</span><h2>{title}</h2></div><button className="icon-button" onClick={onClose} aria-label="Закрыть окно"><X size={20}/></button></header>{children}</dialog>;
}
