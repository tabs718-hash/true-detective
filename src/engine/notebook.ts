import { actions } from './case';
import type { GameState, TranscriptLine } from './types';

export function addNote(state: GameState, text: string): GameState {
  if (state.endingId) throw new Error('Дело завершено');
  const body = text.trim();
  if (!body || body.length > 4000) throw new Error('Запись должна содержать от 1 до 4000 символов');
  if (state.personalNotes.length >= 100) throw new Error('В блокноте уже 100 записей. Отредактируйте существующую.');
  const nextId = Math.max(0, ...state.personalNotes.map(n => Number(n.id.replace('note-', '')) || 0)) + 1;
  return { ...state, personalNotes: [...state.personalNotes, { id: 'note-' + nextId, text: body }] };
}

export function editNote(state: GameState, id: string, text: string): GameState {
  if (state.endingId) throw new Error('Дело завершено');
  const body = text.trim();
  if (!body || body.length > 4000) throw new Error('Запись должна содержать от 1 до 4000 символов');
  if (!state.personalNotes.some(n => n.id === id)) throw new Error('Запись не найдена');
  return { ...state, personalNotes: state.personalNotes.map(n => n.id === id ? { ...n, text: body } : n) };
}

export function removeNote(state: GameState, id: string): GameState {
  if (state.endingId) throw new Error('Дело завершено');
  return { ...state, personalNotes: state.personalNotes.filter(n => n.id !== id) };
}

export function rememberDialogue(state: GameState, actionId: string, lines: TranscriptLine[]): GameState {
  if (state.endingId || !actions[actionId] || !state.completedActions.includes(actionId)) {
    throw new Error('Можно записать только завершённую беседу');
  }
  // A later finding must never rewrite what the witness said earlier.
  if (state.dialogueHistory[actionId]) return state;
  return { ...state, dialogueHistory: { ...state.dialogueHistory, [actionId]: structuredClone(lines) } };
}
