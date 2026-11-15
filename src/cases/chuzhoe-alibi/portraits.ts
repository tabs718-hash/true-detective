import { actionCharacters } from './content';

export type PortraitEmotion = 'neutral' | 'concerned' | 'guarded' | 'firm';
const expressive = new Set(['NORA', 'ELIZABETH', 'BRENNAN', 'DANIEL', 'EDDIE', 'LILLIAN', 'HAYES', 'IRENE']);
const directions: Record<string, { initial: PortraitEmotion; beats?: { from: number; emotion: PortraitEmotion }[] }> = {
  A_NORA_OFFICE: { initial: 'neutral' },
  A_NORA_AFFAIR: { initial: 'concerned', beats: [{ from: 6, emotion: 'guarded' }] },
  A_NORA_ALIBI: { initial: 'firm' },
  A_NORA_SERIOUS: { initial: 'guarded' },
  A_NORA_VISIT: { initial: 'concerned' },
  A_ELIZABETH_1: { initial: 'concerned' },
  A_ELIZABETH_2: { initial: 'guarded', beats: [{ from: 5, emotion: 'concerned' }] },
  A_ELIZABETH_GAP: { initial: 'concerned' },
  A_ELIZABETH_AFFAIR: { initial: 'concerned', beats: [{ from: 4, emotion: 'firm' }] },
  A_ELIZABETH_PRIVATE: { initial: 'firm' },
  A_HOME_STUDY: { initial: 'concerned' },
  A_BRENNAN_1: { initial: 'guarded', beats: [{ from: 4, emotion: 'firm' }] },
  A_BRENNAN_FIN: { initial: 'guarded' },
  A_BRENNAN_AFTER_HAYES: { initial: 'firm' },
  A_DANIEL_FIRST: { initial: 'firm', beats: [{ from: 4, emotion: 'guarded' }] },
  A_DANIEL_EXPOSE: { initial: 'guarded' },
  A_EDDIE: { initial: 'concerned' },
  A_LILLIAN_1: { initial: 'concerned', beats: [{ from: 3, emotion: 'firm' }] },
  A_LILLIAN_FIN: { initial: 'firm' },
  A_FINANCE_AFTER_HAYES: { initial: 'firm' },
  A_HAYES_FIRST: { initial: 'firm' },
  A_HAYES_SECOND: { initial: 'firm' },
  A_IRENE_INTERVIEW: { initial: 'firm' }
};

export function portraitFor(actionId: string, index: number, presenting = false) {
  const character = actionCharacters[actionId] ?? 'COLLEAGUE';
  const base = '/assets/portraits/' + character.toLowerCase() + '.svg';
  const direction = directions[actionId];
  let emotion = direction?.initial ?? 'neutral';
  for (const beat of direction?.beats ?? []) if (index >= beat.from) emotion = beat.emotion;
  if (presenting && expressive.has(character) && actionId !== 'A_NORA_OFFICE') {
    emotion = ['NORA', 'BRENNAN', 'DANIEL'].includes(character) ? 'guarded' : character === 'ELIZABETH' ? 'concerned' : 'firm';
  }
  return { character, emotion, base, source: expressive.has(character) && emotion !== 'neutral' ? '/assets/portraits/emotions/' + character.toLowerCase() + '-' + emotion + '.svg' : base };
}
