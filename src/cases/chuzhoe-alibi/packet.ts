import { cards, characters } from '../../engine/case';
import { verdict } from '../../engine/verdict';
import type { CasePacket, TranscriptLine } from '../../engine/types';
import { cardTitle } from './content';

export interface PacketField { id: string; label: string; cardIds: string[] }

const fields: { id: string; label: string; ids: string[] }[] = [
  { id: 'motive', label: 'Мотив', ids: ['D_FIRING', 'D_LETTER', 'D_INSURANCE', 'D_DIVORCE', 'W_OWEN', 'W_DANIEL_EXPOSED'] },
  { id: 'presence', label: 'Возможность присутствовать', ids: ['W_BRENNAN_1', 'W_ELIZABETH_2', 'D_DIARY', 'W_NORA_VISIT', 'W_EDDIE', 'W_HAYES_1'] },
  { id: 'connection', label: 'Связь с местом или действием', ids: ['E_WRENCH', 'E_BUTTON', 'E_COAT', 'R_BUTTON_MATCH', 'W_NORA_VISIT'] },
  { id: 'medicine', label: 'Судебно-медицинская картина', ids: ['D_AUTOPSY', 'D_SCENE_PHOTOS', 'R_WRENCH', 'R_DELAYED', 'R_EDDIE_COMPAT'] },
  { id: 'contradictions', label: 'Противоречия', ids: ['W_NORA_INITIAL', 'W_NORA_AFFAIR', 'W_IRENE', 'R_WRENCH', 'W_GAS', 'D_DANIEL_ALIBI'] }
];

export function packetFields(packet: CasePacket): PacketField[] {
  return [...fields.map(field => ({ id: field.id, label: field.label, cardIds: packet.selectedCardIds.filter(id => field.ids.includes(id)) })),
    { id: 'witnesses', label: 'Показания', cardIds: packet.selectedCardIds.filter(id => cards[id]?.type === 'witness') }];
}

export function consultationFor(packet: CasePacket): TranscriptLine[] {
  const outcome = verdict(packet);
  const has = (id: string) => packet.selectedCardIds.includes(id);
  const result: TranscriptLine[] = [
    { speaker: 'Прокурор', text: 'Не рассказывайте, что вы знаете в душе. Покажите, что вы собираетесь положить в дело.' },
    { speaker: 'Детектив', text: 'Обвиняемый — ' + (characters[packet.defendant]?.name ?? 'выбранный персонаж') + '. Передаю только эти материалы.' }
  ];
  let opinion = 'Связь обвиняемого с причинением травмы в этом наборе не показана достаточно убедительно. Продолжить расследование вы можете.';
  if (outcome === 'EMPTY_FILE_REPRIMAND') opinion = 'Папка пуста. Я не могу поддерживать догадку, даже когда она изложена уверенным голосом.';
  else if (outcome === 'NORA_CONVICTED') opinion = 'Эта цепочка связывает личный конфликт, назначенную встречу, исследованные предметы и возможность отсроченной смерти. У обвинения есть основания. Но отдельная вещь не доказывает всего происшествия; квалификацию нужно формулировать осторожно.';
  else if (outcome === 'BRENNAN_WRONGFUL_CONVICTION') opinion = 'Угроза, признанное присутствие и предмет со следами — при таком выбранном пакете версия выглядит убедительно. Я оцениваю те материалы, которые вы приложили.';
  else if (packet.defendant === 'BRENNAN' && has('R_WRENCH')) opinion = 'Ваш собственный эксперт исключает ключ как орудие. Угрозы реальны, но строить связь с травмой на этом предмете уже нельзя.';
  else if (packet.defendant === 'ELIZABETH') opinion = has('D_DIVORCE') || has('W_ELIZABETH_AFFAIR') ? 'Семейный конфликт может объяснять подозрение. Он ещё не показывает действие, от которого человек получил травму.' : 'В этом наборе не установлено действие Элизабет, от которого человек получил травму.';
  else if (packet.defendant === 'DANIEL') opinion = has('D_DANIEL_ALIBI') ? 'В приложенной справке подтверждена поездка в Милуоки. Финансовые претензии и причинение травмы — разные вопросы.' : has('W_DANIEL_EXPOSED') || has('D_INVOICE_COMPARE') || has('D_MARLOWE_OWNER') ? 'Финансовые вопросы требуют отдельного рассмотрения. Причинение травмы этот набор не устанавливает.' : 'В этом наборе не установлено, что Дэниел причинил исходную травму.';
  else if (packet.defendant === 'EDDIE') opinion = has('W_EDDIE') ? 'Присутствие, кража и отказ помочь нельзя без дополнительных оснований объявить доказательством первоначального нападения.' : 'В этом наборе не установлено, что Эдди причинил исходную травму.';
  result.push({ speaker: 'Прокурор', text: opinion }, { speaker: 'Прокурор', text: 'Это единственная консультация по вашему делу. Мои замечания не обязывают вас немедленно передавать материалы. Решение остаётся за вами.' });
  return result;
}


export function selectedEvidenceTitles(packet: CasePacket): string[] { return packet.selectedCardIds.map(cardTitle); }
