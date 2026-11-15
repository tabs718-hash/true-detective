import { cards, caseDefinition } from './case';
import type { CasePacket } from './types';

interface CourtRule {
  defendant?: string;
  all?: string[];
  none?: string[];
  oneFromEach?: string[][];
  otherwise?: boolean;
  emptyPacket?: boolean;
}

export function verdict(packet: CasePacket): string {
  const ids = new Set(packet.selectedCardIds);
  if ([...ids].some(id => !Object.hasOwn(cards, id))) throw new Error('Неизвестные материалы');
  const rules = caseDefinition.finalRules;
  if (!ids.size) {
    const empty = Object.entries(rules).find(([, rule]) => typeof rule === 'object' && rule !== null && (rule as CourtRule).emptyPacket);
    if (empty) return empty[0];
  }
  for (const id of rules.priority as string[]) {
    const rule = rules[id] as CourtRule;
    if (rule.defendant !== packet.defendant && rule.defendant !== 'ANY_OTHER') continue;
    if (rule.otherwise) return id;
    if ((rule.all ?? []).every(card => ids.has(card)) &&
        (rule.oneFromEach ?? []).every(group => group.some(card => ids.has(card))) &&
        !(rule.none ?? []).some(card => ids.has(card))) return id;
  }
  throw new Error('В данных дела нет подходящего судебного исхода');
}
