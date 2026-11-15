import { expect, test } from 'vitest';
import { addBoardCard, canPerform, connectCards } from '../src/engine/engine';
import { beforeAffair, lateInvestigation, act } from './routes';

test('удалённая до заказа нить не разрешает лабораторное сравнение', () => {
  let state = lateInvestigation(beforeAffair());
  state = addBoardCard(addBoardCard(state, 'E_BUTTON'), 'E_COAT');
  state = connectCards(state, 'E_BUTTON', 'E_COAT', 'H_BUTTON_COAT_SIMILAR');
  const link = structuredClone(state.board.links[0]);
  expect(canPerform(state, 'A_BUTTON_LAB_REQ')).toBe(true);
  state.board.links = [];
  expect(canPerform(state, 'A_BUTTON_LAB_REQ')).toBe(false);
  state.board.links = [link];
  expect(canPerform(state, 'A_BUTTON_LAB_REQ')).toBe(true);
});

test('замена трактовки до заказа запрещает сравнение, ручная метка гипотезы не влияет', () => {
  let state = lateInvestigation(beforeAffair());
  state = addBoardCard(addBoardCard(state, 'E_BUTTON'), 'E_COAT');
  state = connectCards(state, 'E_BUTTON', 'E_COAT', 'H_BUTTON_COAT_SIMILAR');
  state.board.hypotheses[0].status = 'refuted';
  expect(canPerform(state, 'A_BUTTON_LAB_REQ')).toBe(true);
  state = connectCards(state, 'E_BUTTON', 'E_COAT', 'contradiction');
  expect(canPerform(state, 'A_BUTTON_LAB_REQ')).toBe(false);
  state = connectCards(state, 'E_BUTTON', 'E_COAT', 'H_BUTTON_COAT_SIMILAR');
  state = act(state, 'A_BUTTON_LAB_REQ');
  state.board.links = []; state.board.hypotheses = [];
  state = act(state, 'A_BUTTON_GET');
  expect(state.collectedCards).toContain('R_BUTTON_MATCH');
});
