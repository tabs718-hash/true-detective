export type Condition = {always:true}|{all:Condition[]}|{any:Condition[]}|{atLeast:{n:number;of:Condition[]}}|{fact:string}|{card:string}|{observed:string}|{suspect:string}|{request:{id:string;status:RequestStatus}}|{boardLink:string[]}|{boardHypothesis:string};
export type RequestStatus = 'not_submitted'|'pending'|'ready'|'collected';
export type Effect = {addCard?:string;addFact?:string;addObserved?:string;openRoom?:string;requestUpdate?:{id:string;status:RequestStatus}};
export interface Action {id:string;label:string;mode:'player'|'auto';place:string|null;requires:Condition;effects:Effect[]}
export interface EvidenceCard {id:string;type:'object'|'document'|'witness'|'forensic';source:string;summary:string;requiresManualCollection:boolean}
export interface Room {id:string;name:string;unlockFact:string|null}
export interface CaseDefinition {
  schemaVersion:number;caseId:string;title:string;
  characters:{id:string;name:string;canMarkSuspect:boolean}[];
  characterVisibility:Record<string,string>;
  locations:{id:string;name:string;rooms:Room[]}[];
  evidence:EvidenceCard[];actions:Action[];requests:{id:string}[];
  finalRules:Record<string,unknown>;
}
export interface BoardNode {cardId:string;x:number;y:number}
export interface BoardLink {id:string;from:string;to:string;interpretation:string}
export interface Hypothesis {id:string;linkId:string;text:string;status:'tentative'|'confirmed'|'refuted'}
export interface CasePacket {defendant:string;selectedCardIds:string[]}
export interface TranscriptLine {speaker:string;text:string}
export interface ConsultationRecord {packet:CasePacket;lines:TranscriptLine[]}
export interface GameState {
  saveVersion:1;caseId:string;facts:string[];suspects:string[];openedRooms:string[];
  observedObjects:string[];collectedCards:string[];completedActions:string[];
  requests:Record<string,RequestStatus>;location:string;room:string;visitedLocations:string[];
  board:{nodes:BoardNode[];links:BoardLink[];hypotheses:Hypothesis[];view:{x:number;y:number;zoom:number}};
  casePacket:CasePacket;consultationUsed:boolean;endingId:string|null;
  journal:{id:string;text:string}[];hintUsage:Record<string,number>;
  personalNotes:{id:string;text:string}[];
  dialogueHistory:Record<string,TranscriptLine[]>;
  consultationRecord:ConsultationRecord|null;
  endingProgress:number;
}
