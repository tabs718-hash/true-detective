import { actions, cards, caseDefinition, characters } from './case';
import { actionRooms } from '../cases/chuzhoe-alibi/contexts';
import type { Action, CasePacket, Condition, GameState, RequestStatus } from './types';
const add=(list:string[],id:string)=>{if(!list.includes(id))list.push(id)};
export function initialState():GameState {
  return {saveVersion:1,caseId:caseDefinition.caseId,facts:[],suspects:[],openedRooms:[],observedObjects:[],collectedCards:[],completedActions:[],requests:Object.fromEntries(caseDefinition.requests.map(r=>[r.id,'not_submitted'])),location:'CONSTRUCTION',room:'gate',visitedLocations:[],board:{nodes:[],links:[],hypotheses:[],view:{x:0,y:0,zoom:1}},casePacket:{defendant:'',selectedCardIds:[]},consultationUsed:false,endingId:null,journal:[],hintUsage:{}};
}
export function holds(s:GameState,c:Condition):boolean {
  if('always'in c)return c.always;
  if('all'in c)return c.all.every(x=>holds(s,x));
  if('any'in c)return c.any.some(x=>holds(s,x));
  if('atLeast'in c)return c.atLeast.of.filter(x=>holds(s,x)).length>=c.atLeast.n;
  if('fact'in c)return s.facts.includes(c.fact);
  if('card'in c)return s.collectedCards.includes(c.card);
  if('observed'in c)return s.observedObjects.includes(c.observed);
  if('suspect'in c)return s.suspects.includes(c.suspect);
  if('request'in c)return s.requests[c.request.id]===c.request.status;
  if('boardLink'in c)return s.board.links.some(l=>c.boardLink.includes(l.from)&&c.boardLink.includes(l.to)&&l.from!==l.to);
  if('boardHypothesis'in c)return s.board.links.some(l=>l.interpretation===c.boardHypothesis&&(c.boardHypothesis!=='H_BUTTON_COAT_SIMILAR'||(['E_BUTTON','E_COAT'].includes(l.from)&&['E_BUTTON','E_COAT'].includes(l.to))));
  return false;
}
export function canPerform(s:GameState,id:string){const a=actions[id];return !!a&&!s.endingId&&!s.completedActions.includes(id)&&holds(s,a.requires)}
function apply(s:GameState,a:Action){
  for(const e of a.effects){
    if(e.addCard){if(!cards[e.addCard])throw Error('Неизвестная карточка');add(s.collectedCards,e.addCard)}
    if(e.addFact)add(s.facts,e.addFact);
    if(e.addObserved)add(s.observedObjects,e.addObserved);
    if(e.openRoom)add(s.openedRooms,e.openRoom);
    if(e.requestUpdate){const prev=s.requests[e.requestUpdate.id];const next=e.requestUpdate.status;const flow:RequestStatus[]=['not_submitted','pending','ready','collected'];if(flow.indexOf(next)!==flow.indexOf(prev)+1)throw Error('Неверный переход запроса');s.requests[e.requestUpdate.id]=next}
  }
  add(s.completedActions,a.id);
}
function stabilize(s:GameState){
  for(let i=0;i<=caseDefinition.actions.length;i++){
    const ready=caseDefinition.actions.filter(a=>a.mode==='auto'&&canPerform(s,a.id));
    if(!ready.length)break;
    ready.forEach(a=>apply(s,a));
    if(i===caseDefinition.actions.length)throw Error('Цикл автоматических событий');
  }
  if(s.facts.includes('F_GAME_STARTED'))for(const l of caseDefinition.locations)for(const r of l.rooms)if(!r.unlockFact||s.facts.includes(r.unlockFact))add(s.openedRooms,l.id+'/'+r.id);
  return s;
}
export function perform(s:GameState,id:string):GameState {
  if(!canPerform(s,id)||actions[id].mode!=='player')throw Error('Действие сейчас недоступно');
  if(id!=='A_START'&&actions[id].place!=='BOARD'&&!actionHere(s,id))throw Error('Для этого действия нужно находиться в соответствующем помещении');
  const n=structuredClone(s);apply(n,actions[id]);
  n.journal.push({id:'action-'+id,text:actions[id].label});
  return stabilize(n);
}
export function actionHere(s:GameState,id:string){return (actions[id]?.place===s.location&&actionRooms[id]===s.room)||(id==='A_NORA_ALIBI'&&s.location==='SECRET_APARTMENT'&&s.room==='living')}
export const knownCharacters=(s:GameState)=>caseDefinition.characters.filter(c=>{const id=caseDefinition.characterVisibility[c.id];return s.facts.includes(id)||s.collectedCards.includes(id)});
export function toggleSuspect(s:GameState,id:string){if(s.endingId)throw Error('Дело завершено');if(!knownCharacters(s).some(c=>c.id===id))throw Error('Персонаж неизвестен');const n=structuredClone(s);n.suspects=n.suspects.includes(id)?n.suspects.filter(x=>x!==id):[...n.suspects,id];return n}
export const locationOpen=(s:GameState,id:string)=>s.openedRooms.some(r=>r.startsWith(id+'/'));
export function travel(s:GameState,location:string,room?:string){if(s.endingId)throw Error('Дело завершено');const loc=caseDefinition.locations.find(l=>l.id===location);const r=room??loc?.rooms.find(x=>s.openedRooms.includes(location+'/'+x.id))?.id;if(!r||!s.openedRooms.includes(location+'/'+r))throw Error('Помещение пока закрыто');const n=structuredClone(s);n.location=location;n.room=r;add(n.visitedLocations,location);return n}
export function addBoardCard(s:GameState,cardId:string){if(s.endingId||!s.collectedCards.includes(cardId))throw Error('Карточка недоступна');const n=structuredClone(s);if(!n.board.nodes.some(x=>x.cardId===cardId)){const index=n.board.nodes.length;n.board.nodes.push({cardId,x:90+(index%4)*260,y:90+Math.floor(index/4)*190})}return n}
export function connectCards(s:GameState,from:string,to:string,interpretation:string){
  if(s.endingId||from===to||![from,to].every(id=>s.board.nodes.some(n=>n.cardId===id)))throw Error('Сначала разместите обе карточки на доске');
  if(!['none','same-event','contradiction','H_BUTTON_COAT_SIMILAR'].includes(interpretation))throw Error('Неизвестная трактовка');
  if(interpretation==='H_BUTTON_COAT_SIMILAR'&&![from,to].every(id=>['E_BUTTON','E_COAT'].includes(id)))throw Error('Трактовка не соответствует выбранным предметам');
  const n=structuredClone(s);const id=[from,to].sort().join(':');const existing=n.board.links.find(l=>l.id===id);
  if(existing)existing.interpretation=interpretation;else n.board.links.push({id,from,to,interpretation});
  n.board.hypotheses=n.board.hypotheses.filter(h=>h.linkId!==id);
  if(interpretation!=='none')n.board.hypotheses.push({id:'H:'+id,linkId:id,text:interpretation==='H_BUTTON_COAT_SIMILAR'?'Возможно, пуговица от этого пальто':interpretation==='same-event'?'Предположительно относятся к одному событию':'Возможное противоречие',status:'tentative'});
  if(canPerform(n,'A_BUTTON_COAT_LINK')&&interpretation==='H_BUTTON_COAT_SIMILAR')return perform(n,'A_BUTTON_COAT_LINK');
  return n;
}
type Rule={all:string[];oneFromEach:string[][];none?:string[]};
export function verdict(packet:CasePacket):string{
  const ids=new Set(packet.selectedCardIds);if([...ids].some(id=>!cards[id]))throw Error('Неизвестные материалы');
  if(!ids.size)return 'EMPTY_FILE_REPRIMAND';
  const matches=(key:string)=>{const r=caseDefinition.finalRules[key] as Rule;return r.all.every(x=>ids.has(x))&&r.oneFromEach.every(g=>g.some(x=>ids.has(x)))&&!(r.none??[]).some(x=>ids.has(x))};
  if(packet.defendant==='NORA')return matches('NORA_CONVICTED')?'NORA_CONVICTED':'NORA_ACQUITTED';
  if(packet.defendant==='BRENNAN')return matches('BRENNAN_WRONGFUL_CONVICTION')?'BRENNAN_WRONGFUL_CONVICTION':'BRENNAN_ACQUITTED';
  return ({ELIZABETH:'ELIZABETH_ACQUITTED',DANIEL:'DANIEL_DISMISSED',EDDIE:'EDDIE_DISMISSED',HAYES:'HAYES_DISMISSED'} as Record<string,string>)[packet.defendant]??'OTHER_DISMISSED';
}
export function selectPacket(s:GameState,packet:CasePacket){if(s.endingId)throw Error('Дело завершено');if(packet.defendant&&!knownCharacters(s).some(c=>c.id===packet.defendant))throw Error('Неизвестный обвиняемый');if(packet.selectedCardIds.some(x=>!s.collectedCards.includes(x)))throw Error('В пакете есть ненайденные материалы');return {...s,casePacket:{defendant:packet.defendant,selectedCardIds:[...new Set(packet.selectedCardIds)]}}}
export function consult(s:GameState){if(s.endingId||s.consultationUsed||!characters[s.casePacket.defendant])throw Error('Консультация недоступна');return {...structuredClone(s),consultationUsed:true}}
export function submitCase(s:GameState){if(s.endingId||!s.casePacket.defendant)throw Error('Выберите обвиняемого');return {...structuredClone(s),endingId:verdict(s.casePacket)}}
