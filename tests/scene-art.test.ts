import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import { sceneArt } from '../src/cases/chuzhoe-alibi/art';
import { roomPresentations } from '../src/cases/chuzhoe-alibi/rooms';
import { SceneEvidence } from '../src/features/SceneEvidence';
import { initialState } from '../src/engine/engine';
import type { GameState } from '../src/engine/types';
import { sequence } from './routes';

function evidence(game: GameState, width = 1536, height = 1024) {
  return renderToStaticMarkup(createElement(SceneEvidence, { game, width, height, onItem: () => { throw new Error('Осмотр не должен запускаться при рендере'); } }));
}

test('каждый план имеет фон, а реалистичные ресурсы совпадают с реестром и резервным SVG', () => {
  const manifest = JSON.parse(readFileSync('public/assets/realistic/manifest.json', 'utf8')) as { assets: {file: string; bytes: number; width: number; height: number; sha256: string}[] };
  const used = new Set<string>();
  for (const room of Object.values(roomPresentations)) {
    const art = sceneArt(room.art);
    expect(existsSync('public' + art.src)).toBe(true);
    expect(existsSync('public' + art.fallback)).toBe(true);
    if (art.src === art.fallback) continue;
    const entry = manifest.assets.find(asset => art.src.endsWith('/' + asset.file));
    expect(entry).toBeDefined();
    const bytes = readFileSync('public' + art.src);
    expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    expect(bytes.byteLength).toBe(entry!.bytes);
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(entry!.sha256);
    expect([bytes.readUInt32BE(16), bytes.readUInt32BE(20)]).toEqual([art.width, art.height]);
    expect([art.width, art.height]).toEqual([entry!.width, entry!.height]);
    used.add(entry!.file);
  }
  expect([...used].sort()).toEqual(manifest.assets.map(a => a.file).sort());
});

test('осмотр не убирает предметы с фона, отдельное изъятие убирает только выбранный предмет', () => {
  const observed = sequence(initialState(), ['A_START', 'A_OBSERVE_BUTTON', 'A_OBSERVE_WRENCH']);
  expect(evidence(observed)).toContain('button-object');
  expect(evidence(observed)).toContain('wrench-object');
  const collected = sequence(observed, ['A_COLLECT_BUTTON']);
  expect(evidence(collected)).not.toContain('button-object');
  expect(evidence(collected)).toContain('wrench-object');
  expect(observed.collectedCards).not.toContain('E_BUTTON');
});

test('пальто существует только в личной квартире и остаётся отдельной доступной кнопкой', () => {
  const bedroom = { ...initialState(), location: 'NORA_PRIVATE', room: 'bedroom' };
  const markup = evidence(bedroom);
  expect(markup).toContain('viewBox="0 0 1536 1024"');
  expect(markup).toContain('preserveAspectRatio="xMidYMid slice"');
  expect(markup).toContain('<foreignObject');
  expect(markup).toContain('<button');
  expect(markup).toContain('Осмотреть пальто на стуле');
  expect(evidence({ ...bedroom, collectedCards: ['E_COAT'] })).not.toContain('coat-object');
  expect(evidence({ ...bedroom, location: 'SECRET_APARTMENT', room: 'living' })).toBe('');
  expect(evidence(bedroom, 1600, 1000)).toContain('viewBox="0 0 1600 1000"');
});
