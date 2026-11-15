import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import { characters } from '../src/engine/case';
import { initialState } from '../src/engine/engine';
import { portraitResource } from '../src/cases/chuzhoe-alibi/portraits';
import { sceneItemArt } from '../src/cases/chuzhoe-alibi/items';
import { buildFinale } from '../src/cases/chuzhoe-alibi/court';
import { SceneEvidence } from '../src/features/SceneEvidence';
import { Consultation } from '../src/features/Consultation';
import { ArtworkImage } from '../src/ui/ArtworkImage';

function files(root: string): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(join(root, entry.name)) : [join(root, entry.name)]);
}

test('публикуемый комплект не содержит эскизов: каждый PNG зарегистрирован и проверен', () => {
  const all = files('public/assets');
  expect(all.filter(path => path.endsWith('.svg'))).toEqual([]);
  const registered: string[] = [];
  for (const manifestPath of all.filter(path => path.endsWith('/manifest.json'))) {
    const root = manifestPath.slice(0, -'manifest.json'.length);
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as { assets: {file: string; width: number; height: number; bytes: number; sha256: string}[] };
    for (const asset of manifest.assets) {
      const path = root + asset.file;
      const bytes = readFileSync(path);
      expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
      expect([bytes.readUInt32BE(16), bytes.readUInt32BE(20)]).toEqual([asset.width, asset.height]);
      expect(bytes.byteLength).toBe(asset.bytes);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(asset.sha256);
      registered.push(path);
    }
  }
  expect([...registered].sort()).toEqual(all.filter(path => path.endsWith('.png')).sort());
  expect(new Set(registered).size).toBe(registered.length);
});

test('у каждого персонажа, включая Ричарда, есть реалистичный нейтральный портрет', () => {
  for (const character of Object.keys(characters)) {
    const portrait = portraitResource(character);
    expect(portrait.source.endsWith('.png')).toBe(true);
    expect(existsSync('public' + portrait.source)).toBe(true);
    expect(portrait.sources.every(source => source.endsWith('.png'))).toBe(true);
  }
  const consultation = renderToStaticMarkup(createElement(Consultation, { record: { packet: { defendant: 'NORA', selectedCardIds: [] }, lines: [] }, onClose: () => {} }));
  expect(consultation).toContain(portraitResource('PROSECUTOR').source);
});

test('предметы в сцене используют прозрачные фото, оставаясь отдельными кнопками', () => {
  const game = { ...initialState(), room: 'stairs' };
  const render = (location: string, room: string) => renderToStaticMarkup(createElement(SceneEvidence, { game: { ...game, location, room }, width: 1536, height: 1024, onItem: () => {} }));
  const stairs = render('CONSTRUCTION', 'stairs');
  const coat = render('NORA_PRIVATE', 'bedroom');
  expect(stairs).toContain(sceneItemArt.button.src); expect(stairs).toContain(sceneItemArt.wrench.src);
  expect(coat).toContain(sceneItemArt.coat.src);
  expect(stairs).not.toContain('<path'); expect(coat).not.toContain('<path');
  expect(stairs.match(/<button /g)).toHaveLength(2); expect(coat.match(/<button /g)).toHaveLength(1);
  for (const art of Object.values(sceneItemArt)) {
    const bytes = readFileSync('public' + art.src);
    expect(bytes[25]).toBe(6);
    expect([bytes.readUInt32BE(16), bytes.readUInt32BE(20)]).toEqual([art.width, art.height]);
  }
});

test('все используемые кадры финалов и портреты существуют и не возвращаются к SVG', () => {
  const core = ['R_BUTTON_MATCH', 'E_BUTTON', 'E_COAT', 'D_DIARY', 'D_FIRING', 'W_NORA_SERIOUS', 'R_DELAYED'];
  const packets = [
    { defendant: 'NORA', selectedCardIds: core }, { defendant: 'NORA', selectedCardIds: ['D_DIARY'] },
    { defendant: 'BRENNAN', selectedCardIds: ['W_OWEN', 'W_BRENNAN_1', 'E_WRENCH', 'W_NORA_INITIAL'] },
    { defendant: 'BRENNAN', selectedCardIds: ['R_WRENCH'] }, { defendant: 'ELIZABETH', selectedCardIds: ['W_HAYES_1'] },
    { defendant: 'DANIEL', selectedCardIds: ['D_INVOICE_COMPARE'] }, { defendant: 'NORA', selectedCardIds: [] }
  ];
  for (const packet of packets) for (const scene of buildFinale(packet).scenes) {
    expect(scene.art.endsWith('.png')).toBe(true);
    expect(existsSync('public' + scene.art)).toBe(true);
    if (scene.portrait) expect(existsSync('public' + portraitResource(scene.portrait.character, scene.portrait.emotion).source)).toBe(true);
  }
});

test('недоступное изображение даёт статус, а не резервный эскиз или ошибочный запрос', () => {
  const markup = renderToStaticMarkup(createElement(ArtworkImage, { src: '', alt: 'Помещение' }));
  expect(markup).toContain('Изображение временно недоступно');
  expect(markup).not.toContain('<img'); expect(markup).not.toContain('<svg');
});
