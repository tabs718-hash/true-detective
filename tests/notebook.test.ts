import { describe, expect, test } from 'vitest';
import { addNote, editNote, rememberDialogue, removeNote } from '../src/engine/notebook';
import { initialState, selectPacket, submitCase, toggleSuspect, canPerform, travel, perform } from '../src/engine/engine';
import { parseSave } from '../src/persistence/save';
import { dialogueFor } from '../src/cases/chuzhoe-alibi/content';
import { act, beforeAffair, sequence } from './routes';

describe('Блокнот и протоколы', () => {
  test('личная версия не создаёт доказательств или сюжетных событий', () => {
    const source = beforeAffair();
    const state = addNote(source, 'Соединить пуговицу с пальто. Моя версия: Нора.');
    expect(state.facts).toEqual(source.facts);
    expect(state.collectedCards).toEqual(source.collectedCards);
    expect(state.requests).toEqual(source.requests);
    expect(canPerform(state, 'A_BUTTON_LAB_REQ')).toBe(false);
    expect(source.personalNotes).toHaveLength(0);
  });

  test('редактирование и удаление не затрагивают хронологию и архив', () => {
    const source = beforeAffair();
    let state = addNote(source, 'Первое наблюдение');
    const id = state.personalNotes[0].id;
    state = editNote(state, id, 'Уточнённое наблюдение');
    expect(state.personalNotes[0].text).toBe('Уточнённое наблюдение');
    state = removeNote(state, id);
    expect(state.personalNotes).toEqual([]);
    expect(state.journal).toEqual(source.journal);
    expect(state.collectedCards).toEqual(source.collectedCards);
  });

  test('серьёзный допрос только с ежедневником не предъявляет ненайденные бумаги', () => {
    const lines = dialogueFor('A_NORA_SERIOUS', { collectedCards: ['D_DIARY'] });
    expect(lines.map(l => l.text).join(' ')).not.toMatch(/письм|увольнен/i);
    expect(lines.some(l => l.text.includes('встреча состоялась'))).toBe(true);
    let state = sequence(beforeAffair(), ['A_DELAYED_REQUEST', 'A_DELAYED_GET', 'A_HOME_STUDY', 'A_HOME_DIARY']);
    state = toggleSuspect(state, 'NORA');
    state = act(state, 'A_NORA_SERIOUS');
    expect(state.collectedCards).toContain('W_NORA_SERIOUS');
    expect(state.collectedCards).not.toContain('W_NORA_VISIT');
  });

  test('сохранённая беседа не меняется после получения письма', () => {
    let state = sequence(beforeAffair(), ['A_DELAYED_REQUEST', 'A_DELAYED_GET', 'A_HOME_STUDY', 'A_HOME_DIARY']);
    state = toggleSuspect(state, 'NORA');
    const original = dialogueFor('A_NORA_SERIOUS', state);
    state = rememberDialogue(act(state, 'A_NORA_SERIOUS'), 'A_NORA_SERIOUS', original);
    state = act(state, 'A_HOME_DRAWER');
    state = rememberDialogue(state, 'A_NORA_SERIOUS', dialogueFor('A_NORA_SERIOUS', state));
    expect(state.dialogueHistory.A_NORA_SERIOUS).toEqual(original);
    expect(JSON.stringify(state.dialogueHistory.A_NORA_SERIOUS)).not.toMatch(/письм/i);
    expect(dialogueFor('A_NORA_SERIOUS', state).some(l => l.text.includes('письме'))).toBe(true);
  });

  test('нельзя записать непроведённую беседу или изменить записи после финала', () => {
    expect(() => rememberDialogue(initialState(), 'A_EDDIE', [])).toThrow();
    const state = submitCase(selectPacket(beforeAffair(), { defendant: 'ELIZABETH', selectedCardIds: [] }));
    expect(() => addNote(state, 'Новая версия')).toThrow();
    expect(() => editNote(state, 'note-1', 'Текст')).toThrow();
    expect(() => removeNote(state, 'note-1')).toThrow();
  });

  test('сохранения 0.1 загружаются с новыми полями без потери состояния', () => {
    const original = beforeAffair();
    const legacy = JSON.parse(JSON.stringify(original));
    delete legacy.personalNotes;
    delete legacy.dialogueHistory;
    delete legacy.consultationRecord;
    delete legacy.endingProgress;
    const migrated = parseSave(legacy);
    expect(migrated.personalNotes).toEqual([]);
    expect(migrated.dialogueHistory).toEqual({});
    expect(migrated.consultationRecord).toBeNull();
    expect(migrated.endingProgress).toBe(0);
    expect(migrated.collectedCards).toEqual(original.collectedCards);
    expect(migrated.requests).toEqual(original.requests);
    expect(migrated.openedRooms).toEqual(original.openedRooms);
  });

  test('новые записи и протокол восстанавливаются вместе с ручным сейвом', () => {
    let state = addNote(beforeAffair(), 'Два адреса — две разные квартиры.');
    state = travel(state, 'POLICE', 'interrogation');
    state = rememberDialogue(perform(state, 'A_BRENNAN_FIN'), 'A_BRENNAN_FIN', dialogueFor('A_BRENNAN_FIN', state));
    expect(parseSave(JSON.parse(JSON.stringify(state)))).toEqual(state);
  });
});
