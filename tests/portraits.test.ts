import { expect, test } from 'vitest';
import { portraitFor } from '../src/cases/chuzhoe-alibi/portraits';
import { dialogueFor } from '../src/cases/chuzhoe-alibi/content';

test('первая Нора остаётся нейтральной, без визуального обвинения при предъявлении', () => {
  for (let i = 0; i < dialogueFor('A_NORA_OFFICE').length; i++) {
    expect(portraitFor('A_NORA_OFFICE', i).emotion).toBe('neutral');
    expect(portraitFor('A_NORA_OFFICE', i, true).emotion).toBe('neutral');
  }
});

test('Айрин не получает защитную или виноватую мимику при проверке алиби', () => {
  for (let i = 0; i < dialogueFor('A_IRENE_INTERVIEW').length; i++) {
    expect(portraitFor('A_IRENE_INTERVIEW', i, true).emotion).toBe('firm');
  }
});

test('защитная реакция не является уникальной меткой одного персонажа', () => {
  expect(portraitFor('A_NORA_SERIOUS', 0).emotion).toBe('guarded');
  expect(portraitFor('A_BRENNAN_1', 0).emotion).toBe('guarded');
  expect(portraitFor('A_DANIEL_EXPOSE', 0).emotion).toBe('guarded');
  expect(portraitFor('A_ELIZABETH_2', 0).emotion).toBe('guarded');
});
