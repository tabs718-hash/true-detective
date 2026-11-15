import { useState } from 'react';
import { SceneEvidence } from './SceneEvidence';
import '../ui/scene-evidence.css';
import { ArrowUpRight, ChevronRight, DoorOpen, FileText, MessageCircle, Search, LockKeyhole, MapPin, Scale } from 'lucide-react';
import { caseDefinition, characters } from '../engine/case';
import { actionHere, canPerform, knownCharacters } from '../engine/engine';
import type { GameState } from '../engine/types';
import { closedRoomReason, roomPresentation } from '../cases/chuzhoe-alibi/rooms';
import { actionCharacters, actionLabels, locationSubtitles } from '../cases/chuzhoe-alibi/content';
import { sceneArt } from '../cases/chuzhoe-alibi/art';
import { SceneBackground } from '../ui/SceneBackground';
type Props={game:GameState;onTravel:(loc:string,room?:string)=>void;onAct:(id:string)=>void;onItem:(id:string)=>void;onDetail:(title:string,text:string)=>void;onConsult:()=>void};
const roomNames:Record<string,string>={gate:'У главных ворот',stairs:'У основания лестницы',side:'Боковой проход',storage:'Складская зона',desk:'Общий зал',interrogation:'Допросная',forensics:'Кабинет криминалиста',reception:'Приёмная',accounting:'Бухгалтерия',richard_work_office:'Рабочий кабинет',salon:'Гостиная',elizabeth_private:'Личные комнаты',richard_home_study:'Домашний кабинет',cashier:'Касса',living:'Гостиная',bedroom:'Спальня',meeting:'Приём прокурора'};
export function Scene({game,onTravel,onAct,onItem,onDetail,onConsult}:Props){
 const location=caseDefinition.locations.find(l=>l.id===game.location)!;
 const here=caseDefinition.actions.filter(a=>a.mode==='player'&&a.id!=='A_START'&&canPerform(game,a.id)&&actionHere(game,a.id));
 const people=[...new Set(here.map(a=>actionCharacters[a.id]).filter(Boolean))];
 const permanent:Record<string,string[]>={gate:['FRANK'],reception:['NORA'],accounting:['LILLIAN'],salon:['ELIZABETH'],living:['NORA'],desk:['COLLEAGUE'],forensics:['EXPERT'],meeting:['PROSECUTOR']};
 for(const id of permanent[game.room]??[])if(knownCharacters(game).some(c=>c.id===id)&&!people.includes(id))people.push(id);
 const physical=['A_OBSERVE_WRENCH','A_COLLECT_WRENCH','A_OBSERVE_BUTTON','A_COLLECT_BUTTON','A_OBSERVE_COAT','A_COLLECT_COAT'];
 const objects=here.filter(a=>!actionCharacters[a.id]&&!physical.includes(a.id));
 const presentation=roomPresentation(game.location,game.room);
 const art=sceneArt(presentation.art);
 const [loadedArt,setLoadedArt]=useState<{art:string;width:number;height:number}|null>(null);
 const dimensions=loadedArt?.art===presentation.art?loadedArt:art;
 const roomText=presentation.description;
 const spatial:Record<string,{x:number;y:number}>={A_HOME_DRAWER:{x:30,y:73},A_HOME_DIARY:{x:66,y:61},A_INVOICE:{x:49,y:56},A_RENT_TALLY:{x:73,y:68}};
 return <div className="scene-layout"><section className={'scene-stage room-'+game.room} aria-label={location.name+' — '+roomNames[game.room]}><SceneBackground art={presentation.art} className="scene-art" onDimensions={(width,height)=>setLoadedArt({art:presentation.art,width,height})}/><div className="scene-vignette"/><div className="scene-title"><span className="eyebrow"><MapPin size={12}/>{locationSubtitles[game.location]}</span><h1>{location.name}</h1><span className="scene-room">{roomNames[game.room]}</span></div><span className="scene-take">CHICAGO · 1966</span>
 {location.rooms.length>1&&<div className="scene-doors">{location.rooms.filter(r=>r.id!==game.room&&game.openedRooms.includes(location.id+'/'+r.id)).map(r=><button key={r.id} aria-label={'Дверь: '+r.name} onClick={()=>onTravel(location.id,r.id)}><DoorOpen size={20} strokeWidth={1}/><span>{r.name}</span><ChevronRight size={12}/></button>)}</div>}
 <SceneEvidence game={game} width={dimensions.width} height={dimensions.height} onItem={onItem}/>
 <div className="document-hotspots">{objects.filter(a=>spatial[a.id]).map(a=><button className="object-hotspot" data-action={a.id} key={a.id} style={{left:spatial[a.id].x+'%',top:spatial[a.id].y+'%'}} onClick={()=>onAct(a.id)}><FileText size={17}/><span>{actionLabels[a.id]??a.label}</span><ArrowUpRight size={14}/></button>)}</div><div className="scene-objects">{objects.filter(a=>!spatial[a.id]).map(a=><button className="object-hotspot" data-action={a.id} key={a.id} onClick={()=>onAct(a.id)}><FileText size={17}/><span>{actionLabels[a.id]??a.label}</span><ArrowUpRight size={14}/></button>)}</div>
 {people.length>0&&<div className="scene-person"><img src={'/assets/portraits/'+people[0].toLowerCase()+'.svg'} alt={characters[people[0]]?.name??'Собеседник'}/></div>}
 <div className="scene-caption"><span className="caption-line"/><p>{roomText}</p><span className="prototype-label">{sceneArt(presentation.art).caption}</span></div>
 </section><aside className="scene-sidebar"><div className="sidebar-section"><span className="eyebrow">В этой локации</span><h2>Помещения</h2><div className="room-list">{location.rooms.map(r=>{const open=game.openedRooms.includes(location.id+'/'+r.id);return <button key={r.id} className={game.room===r.id?'active':''} onClick={()=>open?onTravel(location.id,r.id):onDetail(r.name,closedRoomReason(game.location,r.id))} aria-label={r.name+(open?'':' — закрыто')}>{open?<DoorOpen size={17}/>:<LockKeyhole size={15}/>}<span>{r.name}</span>{open&&<ChevronRight size={14}/>}</button>})}</div></div><div className="sidebar-section people-section"><span className="eyebrow">Люди и разговоры</span>{people.map(person=><div className="person-topics" key={person}><div className="person-label"><span className="person-initial">{characters[person]?.name.slice(0,1)}</span><div><h3>{game.location==='GAS_STATION'?'Кассир':characters[person]?.name}</h3><span>{game.suspects.includes(person)?'Отмечен подозреваемым':'Можно поговорить'}</span></div></div>{here.filter(a=>actionCharacters[a.id]===person).map(a=><button className="topic-button" key={a.id} data-action={a.id} onClick={()=>onAct(a.id)}><MessageCircle size={14}/><span>{actionLabels[a.id]??a.label}</span><ChevronRight size={13}/></button>)}{!here.some(a=>actionCharacters[a.id]===person)&&<p className="quiet-note">Новых вопросов пока нет. Прежние показания сохранены в архиве.</p>}</div>)}{!people.length&&<p className="quiet-note">В комнате никого нет.</p>}{game.location==='PROSECUTOR'&&<button className="primary full" disabled={game.consultationUsed||!game.casePacket.defendant} onClick={onConsult}><Scale size={16}/>{game.consultationUsed?'Консультация использована':'Обсудить выбранный пакет'}</button>}</div><div className="room-observations">{presentation.details.map(detail=><button key={detail.title} onClick={()=>onDetail(detail.title,detail.text)}><Search size={14}/><span>{detail.title}</span><ChevronRight size={12}/></button>)}</div><button className="scene-examine" onClick={()=>onDetail(roomNames[game.room],roomText)}><Search size={17}/><span>Осмотреть обстановку</span><ChevronRight size={15}/></button></aside></div>;
}
