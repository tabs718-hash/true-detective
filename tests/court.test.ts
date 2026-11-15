import { describe, expect, test } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { buildFinale } from '../src/cases/chuzhoe-alibi/court';
import { consultationFor, packetFields } from '../src/cases/chuzhoe-alibi/packet';
import { verdict } from '../src/engine/verdict';
import { cards } from '../src/engine/case';
import { selectPacket, submitCase, consult } from '../src/engine/engine';
import { EndingPlayer } from '../src/features/EndingPlayer';
import { beforeAffair, labMatch, lateInvestigation, winPacket } from './routes';

const core = ['R_BUTTON_MATCH', 'E_BUTTON', 'E_COAT', 'D_DIARY', 'D_FIRING', 'W_NORA_SERIOUS', 'R_DELAYED'];
const wrongful = ['W_OWEN', 'W_BRENNAN_1', 'E_WRENCH', 'W_NORA_INITIAL'];

describe('Судебная подача', () => {
  test('признание и реконструкция идут строго после решения', () => {
    const sequence = buildFinale({ defendant: 'NORA', selectedCardIds: core });
    const decision = sequence.scenes.findIndex(scene => scene.phase === 'decision');
    expect(decision).toBeGreaterThan(0);
    for (let i = 0; i <= decision; i++) {
      expect(sequence.scenes[i].revealsTruth).toBe(false);
      expect(sequence.scenes[i].phase).not.toBe('reconstruction');
    }
    expect(sequence.scenes.findIndex(scene => scene.revealsTruth)).toBeGreaterThan(decision);
    expect(sequence.scenes.filter(scene => scene.phase === 'reconstruction')).toHaveLength(4);
  });

  test('суд не ссылается на непредъявленные медицину, показания или финансовую вину', () => {
    const ids = [...core.filter(id => id !== 'R_DELAYED'), 'W_EDDIE'];
    const sequence = buildFinale({ defendant: 'NORA', selectedCardIds: ids });
    const hearings = sequence.scenes.filter(scene => scene.phase === 'hearing');
    const text = hearings.flatMap(scene => scene.paragraphs).join(' ');
    expect(text).toContain('Эдди сообщает');
    expect(text).not.toContain('Медицинское дополнение');
    expect(text).not.toContain('Айрин действительно');
    expect(sequence.scenes.flatMap(scene => scene.citedCardIds).every(id => ids.includes(id))).toBe(true);
    expect(sequence.scenes.find(scene => scene.id === 'true-epilogue')?.paragraphs.join(' ')).not.toContain('Финансовая роль Дэниела');
  });

  test('выбранная Айрин объясняется как правдивое, совместимое свидетельство', () => {
    const sequence = buildFinale({ defendant: 'NORA', selectedCardIds: [...core, 'W_IRENE'] });
    const medical = sequence.scenes.find(scene => scene.id === 'nora-medical')!;
    expect(medical.paragraphs.join(' ')).toContain('Айрин действительно видела Нору дома около 21:15');
    expect(medical.paragraphs.join(' ')).toContain('совместимо с более ранним');
    expect(medical.citedCardIds).toContain('W_IRENE');
  });

  test.each([
    { defendant: 'NORA', selectedCardIds: Object.keys(cards).filter(id => id !== 'R_BUTTON_MATCH') },
    { defendant: 'BRENNAN', selectedCardIds: wrongful },
    { defendant: 'BRENNAN', selectedCardIds: [...wrongful, 'R_WRENCH'] },
    { defendant: 'ELIZABETH', selectedCardIds: Object.keys(cards) },
    { defendant: 'DANIEL', selectedCardIds: Object.keys(cards) },
    { defendant: 'EDDIE', selectedCardIds: Object.keys(cards) },
    { defendant: 'HAYES', selectedCardIds: Object.keys(cards) },
    { defendant: 'RICHARD', selectedCardIds: Object.keys(cards) },
    { defendant: 'NORA', selectedCardIds: [] }
  ])('плохой исход не раскрывает истину: $defendant', packet => {
    const sequence = buildFinale(packet);
    expect(sequence.scenes.every(scene => !scene.revealsTruth)).toBe(true);
    expect(sequence.scenes.some(scene => scene.phase === 'reconstruction')).toBe(false);
    const publicText = sequence.scenes.flatMap(scene => scene.paragraphs).join(' ');
    expect(publicText).not.toMatch(/я толкнула|нора толкает|с пальто отделяется пуговица|Ричард подтверждает разрыв/i);
    expect(sequence.scenes.every(scene => !/\/(argument|fall|alive|home)\.(?:png|svg)$/.test(scene.art))).toBe(true);
  });

  test('повреждённая отметка правильного финала не раскрывает истину', () => {
    const sequence = buildFinale({ defendant: 'NORA', selectedCardIds: ['D_DIARY'] }, 'NORA_CONVICTED');
    expect(sequence.verified).toBe(false);
    expect(sequence.scenes.every(scene => !scene.revealsTruth)).toBe(true);
    expect(sequence.scenes.some(scene => scene.phase === 'reconstruction')).toBe(false);
  });

  test('непредъявленный отчёт из полного архива не появляется в судебной сцене', () => {
    let game = labMatch(lateInvestigation(beforeAffair()));
    game.collectedCards.push('R_WRENCH');
    game = submitCase(selectPacket(game, { defendant: 'BRENNAN', selectedCardIds: wrongful }));
    expect(game.endingId).toBe('BRENNAN_WRONGFUL_CONVICTION');
    const sequence = buildFinale(game.casePacket, game.endingId);
    for (let index = 0; index < sequence.scenes.length; index++) {
      const html = renderToStaticMarkup(createElement(EndingPlayer, { game: { ...game, endingProgress: index }, onProgress() {}, onNewGame() {}, notice() {} }));
      expect(html).not.toContain('исключает ключ');
      expect(html).not.toContain('/assets/finale/fall.png');
      expect(html).not.toContain('Я толкнула');
    }
  });

  test('в тексте реконструкции нет объективного возвращения в 20:18', () => {
    expect(JSON.stringify(buildFinale({ defendant: 'NORA', selectedCardIds: core }))).not.toContain('20:18');
  });
});

describe('Консультация и выбранный пакет', () => {
  test('снимок замечаний не меняется после редактирования обвинения', () => {
    let game = selectPacket(beforeAffair(), { defendant: 'BRENNAN', selectedCardIds: wrongful });
    const lines = consultationFor(game.casePacket);
    game = consult(game, lines);
    const record = structuredClone(game.consultationRecord);
    lines[0].text = 'Изменение исходного массива';
    game = selectPacket(game, { defendant: 'NORA', selectedCardIds: ['E_BUTTON'] });
    expect(game.consultationRecord).toEqual(record);
    expect(game.consultationRecord?.packet.defendant).toBe('BRENNAN');
    expect(() => consult(game, consultationFor(game.casePacket))).toThrow();
  });

  test('прокурор узнаёт об исключении ключа только из выбранного отчёта', () => {
    const without = consultationFor({ defendant: 'BRENNAN', selectedCardIds: wrongful }).map(line => line.text).join(' ');
    const withReport = consultationFor({ defendant: 'BRENNAN', selectedCardIds: [...wrongful, 'R_WRENCH'] }).map(line => line.text).join(' ');
    expect(without).not.toContain('исключает ключ');
    expect(withReport).toContain('исключает ключ');
  });

  test('оценка заполненности содержит только выбранные карточки', () => {
    const packet = { defendant: 'NORA', selectedCardIds: ['D_DIARY'] };
    const fields = packetFields(packet);
    expect(fields.find(field => field.id === 'presence')?.cardIds).toEqual(['D_DIARY']);
    expect(fields.find(field => field.id === 'medicine')?.cardIds).toEqual([]);
    expect(fields.flatMap(field => field.cardIds).every(id => packet.selectedCardIds.includes(id))).toBe(true);
  });

  test('правило вердикта остаётся каноническим при подаче из интерфейса', () => {
    const game = labMatch(lateInvestigation(beforeAffair()));
    expect(verdict(winPacket(game))).toBe('NORA_CONVICTED');
    expect(buildFinale(winPacket(game)).outcomeId).toBe('NORA_CONVICTED');
    expect(verdict({ defendant: 'ELIZABETH', selectedCardIds: core })).toBe('ELIZABETH_ACQUITTED');
  });
});
