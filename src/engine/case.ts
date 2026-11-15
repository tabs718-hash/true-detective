import { z } from 'zod';
import raw from '../cases/chuzhoe-alibi/generated.json' with {type:'json'};
import type { CaseDefinition, Condition } from './types';
const status=z.enum(['not_submitted','pending','ready','collected']);
const condition:z.ZodType<Condition>=z.lazy(()=>z.union([
  z.object({always:z.literal(true)}),z.object({all:z.array(condition)}),z.object({any:z.array(condition)}),
  z.object({atLeast:z.object({n:z.number().int().nonnegative(),of:z.array(condition)})}),
  z.object({fact:z.string()}),z.object({card:z.string()}),z.object({observed:z.string()}),z.object({suspect:z.string()}),
  z.object({request:z.object({id:z.string(),status})}),z.object({boardLink:z.array(z.string()).length(2)}),z.object({boardHypothesis:z.string()})
]));
const schema=z.object({schemaVersion:z.literal(1),caseId:z.string(),title:z.string(),characters:z.array(z.object({id:z.string(),name:z.string(),canMarkSuspect:z.boolean()})),characterVisibility:z.record(z.string(),z.string()),locations:z.array(z.object({id:z.string(),name:z.string(),rooms:z.array(z.object({id:z.string(),name:z.string(),unlockFact:z.string().nullable()}))})),evidence:z.array(z.object({id:z.string(),type:z.enum(['object','document','witness','forensic']),source:z.string(),summary:z.string(),requiresManualCollection:z.boolean()})),requests:z.array(z.object({id:z.string()})),actions:z.array(z.object({id:z.string(),label:z.string(),mode:z.enum(['player','auto']),place:z.string().nullable(),requires:condition,effects:z.array(z.object({addCard:z.string().optional(),addFact:z.string().optional(),addObserved:z.string().optional(),openRoom:z.string().optional(),requestUpdate:z.object({id:z.string(),status}).optional()}))})),finalRules:z.record(z.string(),z.unknown())});
export const caseDefinition:CaseDefinition=schema.parse(raw);
export const actions=Object.fromEntries(caseDefinition.actions.map(a=>[a.id,a]));
export const cards=Object.fromEntries(caseDefinition.evidence.map(c=>[c.id,c]));
export const characters=Object.fromEntries(caseDefinition.characters.map(c=>[c.id,c]));
