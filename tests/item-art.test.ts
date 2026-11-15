import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import { itemArt, type ItemKind } from '../src/cases/chuzhoe-alibi/items';
import { ItemArtwork } from '../src/ui/ItemArtwork';
import { PrototypeItemArtwork } from '../src/ui/PrototypeItemArtwork';
import { ItemInspection } from '../src/features/ItemInspection';

const kinds = Object.keys(itemArt) as ItemKind[];

test('общие изображения осмотра и архива соответствуют реестру исходных файлов', () => {
  const manifest = JSON.parse(readFileSync('public/assets/items/manifest.json', 'utf8')) as { assets: { file: string; width: number; height: number; bytes: number; sha256: string }[] };
  expect(manifest.assets.map(a => '/assets/items/' + a.file).sort()).toEqual(kinds.map(kind => itemArt[kind].src).sort());
  for (const kind of kinds) {
    const art = itemArt[kind];
    const bytes = readFileSync('public' + art.src);
    const record = manifest.assets.find(a => art.src === '/assets/items/' + a.file)!;
    expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    expect([bytes.readUInt32BE(16), bytes.readUInt32BE(20)]).toEqual([art.width, art.height]);
    expect([record.width, record.height]).toEqual([art.width, art.height]);
    expect(bytes.byteLength).toBe(record.bytes);
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(record.sha256);
    expect(renderToStaticMarkup(createElement(ItemArtwork, { kind }))).toContain(art.src);
    expect(renderToStaticMarkup(createElement(PrototypeItemArtwork, { kind }))).toContain('<svg');
  }
});

test('каждая деталь имеет собственный ракурс в пределах того же изображения', () => {
  for (const kind of kinds) {
    const art = itemArt[kind];
    expect(art.views[0].frame).not.toEqual(art.views[1].frame);
    for (let detail = 0; detail < art.views.length; detail++) {
      const view = art.views[detail];
      const [x, y, w, h] = view.frame;
      expect(x).toBeGreaterThanOrEqual(0); expect(y).toBeGreaterThanOrEqual(0);
      expect(w).toBeGreaterThan(0); expect(h).toBeGreaterThan(0);
      expect(x + w).toBeLessThanOrEqual(art.width); expect(y + h).toBeLessThanOrEqual(art.height);
      expect(w / h).toBe(art.width / art.height);
      const markup = renderToStaticMarkup(createElement(ItemArtwork, { kind, detail }));
      expect(markup).toContain(`viewBox="${view.frame.join(' ')}"`);
      expect(markup).toContain(art.src);
      expect(markup).toContain(view.label);
    }
  }
});

test('осмотр сохраняет отдельное изъятие, архивный просмотр не предлагает изъять повторно', () => {
  const fail = () => { throw new Error('Рендер не должен изымать предмет'); };
  for (const kind of kinds) {
    const onSite = renderToStaticMarkup(createElement(ItemInspection, { kind, onCollect: fail, onClose: fail }));
    expect(onSite).toContain('Изъять в дело');
    expect(onSite).toContain('Оставить на месте');
    expect(onSite).toContain('Предмет остаётся на месте до отдельного изъятия.');
    const archive = renderToStaticMarkup(createElement(ItemInspection, { kind, collected: true, onCollect: fail, onClose: fail }));
    expect(archive).not.toContain('Изъять в дело');
    expect(archive).toContain('Предмет находится в архиве дела.');
  }
});
