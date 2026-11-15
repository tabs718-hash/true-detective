import { expect, test } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { portraitFor, portraitResource, realisticPortraitCharacters, realisticPortraitEmotions, type PortraitEmotion } from '../src/cases/chuzhoe-alibi/portraits';
import { actionCharacters, dialogueFor } from '../src/cases/chuzhoe-alibi/content';
import { Portrait } from '../src/ui/Portrait';
import { Dialogue } from '../src/features/Dialogue';
import { Scene } from '../src/features/Scene';
import { travel } from '../src/engine/engine';
import { beforeAffair } from './routes';

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

test('реалистичные персонажи имеют все заявленные выражения и совпадающий реестр', () => {
  const manifest = JSON.parse(readFileSync('public/assets/portraits/realistic/manifest.json', 'utf8')) as { assets: {file: string; width: number; height: number; bytes: number; sha256: string; pngColorType: number}[] };
  const used: string[] = [];
  for (const character of realisticPortraitCharacters) {
    const dimensions: string[] = [];
    const hashes: string[] = [];
    for (const emotion of realisticPortraitEmotions[character]) {
      const resource = portraitResource(character, emotion);
      const record = manifest.assets.find(a => resource.source === '/assets/portraits/realistic/' + a.file)!;
      expect(record).toBeDefined();
      const bytes = readFileSync('public' + resource.source);
      expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
      expect(bytes[25]).toBe(6);
      expect(record.pngColorType).toBe(6);
      expect([bytes.readUInt32BE(16), bytes.readUInt32BE(20)]).toEqual([record.width, record.height]);
      expect(bytes.byteLength).toBe(record.bytes);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(record.sha256);
      dimensions.push(record.width + ':' + record.height); hashes.push(record.sha256); used.push(record.file);
    }
    expect(new Set(dimensions).size).toBe(1);
    expect(new Set(hashes).size).toBe(realisticPortraitEmotions[character].length);
  }
  expect(used.sort()).toEqual(manifest.assets.map(a => a.file).sort());
});

test('новое выражение откатывается к той же нейтральной внешности, без старого дизайна Норы', () => {
  for (const character of realisticPortraitCharacters) {
    const neutral = portraitResource(character);
    expect(neutral.sources).toEqual([neutral.source]);
    for (const emotion of realisticPortraitEmotions[character].filter(value => value !== 'neutral')) {
      const expressive = portraitResource(character, emotion);
      expect(expressive.sources).toEqual([expressive.source, neutral.source]);
      expect(expressive.sources.every(src => existsSync('public' + src) && src.endsWith('.png'))).toBe(true);
    }
  }
  expect(portraitResource('OWEN', 'firm').source).toBe('/assets/portraits/owen.svg');
});

test('отсутствующее выражение сразу выбирает новый нейтральный PNG без лишнего запроса', () => {
  for (const [character, emotion] of [['IRENE', 'guarded'], ['IRENE', 'concerned'], ['DANIEL', 'concerned'], ['LILLIAN', 'guarded'], ['FRANK', 'concerned'], ['FRANK', 'firm'], ['FRANK', 'guarded']] as [string, PortraitEmotion][]) {
    const neutral = portraitResource(character);
    expect(portraitResource(character, emotion).sources).toEqual([neutral.source]);
  }
});

test('портреты свидетелей сохраняют пределы их реакций и не добавляют новых знаний', () => {
  for (const presenting of [false, true]) {
    for (let index = 0; index < dialogueFor('A_FRANK').length; index++) {
      expect(portraitFor('A_FRANK', index, presenting).emotion).toBe('neutral');
      expect(portraitFor('A_FRANK', index, presenting).source).toBe(portraitResource('FRANK').source);
    }
    for (const action of ['A_HAYES_FIRST', 'A_HAYES_SECOND']) {
      expect(portraitFor(action, 0, presenting).emotion).toBe('firm');
      expect(portraitFor(action, 0, presenting).source).toBe(portraitResource('HAYES', 'firm').source);
    }
  }
  expect(portraitFor('A_EDDIE', 0).emotion).toBe('concerned');
  expect(portraitFor('A_EDDIE', 0, true).emotion).toBe('firm');
  // Portrait rendering does not edit witness lines or turn uncertainty into identification.
  expect(dialogueFor('A_EDDIE').map(line => line.text).join(' ')).toContain('Я не видел');
});

test('все используемые в репликах выражения новых персонажей подготовлены', () => {
  for (const action of Object.keys(actionCharacters)) {
    for (const index of [0, 3, 4, 6, 20]) for (const presenting of [false, true]) {
      const portrait = portraitFor(action, index, presenting);
      if (!realisticPortraitCharacters.includes(portrait.character)) continue;
      expect(realisticPortraitEmotions[portrait.character]).toContain(portrait.emotion);
      expect(portrait.source).toBe(`/assets/portraits/realistic/${portrait.character.toLowerCase()}-${portrait.emotion}.png`);
      expect(existsSync('public' + portrait.source)).toBe(true);
    }
  }
});

test('общий портрет использует тот же ресурс и корректное имя для каждого нового персонажа', () => {
  for (const character of realisticPortraitCharacters) {
    const resource = portraitResource(character);
    const markup = renderToStaticMarkup(createElement(Portrait, { character, alt: character }));
    expect(markup).toContain(`src="${resource.source}"`);
    expect(markup).toContain(`alt="${character}"`);
  }
});

test('первая Нора в сцене и диалоге использует новый нейтральный портрет', () => {
  const expected = portraitResource('NORA').source;
  const game = travel(beforeAffair(), 'WHITMORE_OFFICE', 'reception');
  const scene = renderToStaticMarkup(createElement(Scene, { game, onTravel: () => {}, onAct: () => {}, onItem: () => {}, onDetail: () => {}, onConsult: () => {} }));
  const dialogue = renderToStaticMarkup(createElement(Dialogue, { id: 'A_NORA_OFFICE', lines: dialogueFor('A_NORA_OFFICE'), cardIds: [], speed: 0, onComplete: () => {}, onClose: () => {} }));
  expect(scene).toContain(`src="${expected}"`);
  expect(dialogue).toContain(`src="${expected}"`);
  expect(portraitFor('A_NORA_OFFICE', 0, true).source).toBe(expected);
});
