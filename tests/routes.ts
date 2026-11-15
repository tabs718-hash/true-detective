import { actions } from '../src/engine/case';
import { addBoardCard, connectCards, initialState, perform, toggleSuspect, travel } from '../src/engine/engine';
import { actionRooms } from '../src/cases/chuzhoe-alibi/contexts';
import type { GameState } from '../src/engine/types';
export function act(s:GameState,id:string){const a=actions[id];const routed=id!=='A_START'&&a.place&&a.place!=='BOARD'?travel(s,a.place,actionRooms[id]):s;return perform(routed,id)}
export function sequence(s:GameState,ids:string[]){return ids.reduce(act,s)}
export function beforeAffair({wrench=true,button=true}={}){
 let s=sequence(initialState(),['A_START','A_FRANK','A_SCENE_PHOTOS','A_AUTOPSY','A_NORA_OFFICE','A_OWEN','A_BRENNAN_1','A_LILLIAN_1','A_WORK_OFFICE','A_INVOICE','A_RENT_TALLY','A_DANIEL_FIRST','A_ELIZABETH_1','A_HAYES_FIRST','A_ELIZABETH_2','A_ELIZABETH_GAP']);
 if(wrench)s=sequence(s,['A_OBSERVE_WRENCH','A_COLLECT_WRENCH']);
 if(button)s=sequence(s,['A_OBSERVE_BUTTON','A_COLLECT_BUTTON']);
 return sequence(s,['A_REQUEST_OWNER','A_LILLIAN_FIN','A_OWNER_GET','A_ADDRESS_REQUEST','A_ADDRESS_GET','A_NORA_AFFAIR']);
}
export function lateInvestigation(s:GameState,{medicalFirst=false,seriousFirst=false}={}){
 if(medicalFirst)s=sequence(s,['A_DELAYED_REQUEST','A_DELAYED_GET','A_HOME_STUDY','A_ELIZABETH_AFFAIR','A_HAYES_SECOND','A_EDDIE','A_EDDIE_COMPAT']);
 else s=sequence(s,['A_ELIZABETH_AFFAIR','A_HAYES_SECOND','A_EDDIE','A_DELAYED_REQUEST','A_DELAYED_GET','A_EDDIE_COMPAT','A_HOME_STUDY']);
 s=sequence(s,['A_HOME_DRAWER','A_HOME_DIARY']);s=toggleSuspect(s,'NORA');
 if(seriousFirst)s=act(s,'A_NORA_SERIOUS');
 s=sequence(s,['A_NORA_ADDRESS_REQ','A_NORA_ADDRESS_GET','A_OBSERVE_COAT','A_COLLECT_COAT']);
 if(!seriousFirst)s=act(s,'A_NORA_SERIOUS');return s;
}
export function labMatch(s:GameState){s=addBoardCard(addBoardCard(s,'E_BUTTON'),'E_COAT');s=connectCards(s,'E_BUTTON','E_COAT','H_BUTTON_COAT_SIMILAR');return sequence(s,['A_BUTTON_LAB_REQ','A_BUTTON_GET'])}
export function winPacket(s:GameState){return {defendant:'NORA',selectedCardIds:['R_BUTTON_MATCH','E_BUTTON','E_COAT','D_DIARY','D_FIRING','W_NORA_SERIOUS','R_DELAYED','W_EDDIE','W_IRENE'].filter(x=>s.collectedCards.includes(x))}}
