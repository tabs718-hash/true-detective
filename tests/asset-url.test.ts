import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, test, vi } from 'vitest';
import { assetUrl } from '../src/ui/asset-url';
import { ArtworkImage } from '../src/ui/ArtworkImage';
import { Portrait } from '../src/ui/Portrait';
import { ItemArtwork } from '../src/ui/ItemArtwork';

afterEach(()=>vi.unstubAllEnvs());

test('ресурсы корневого сайта сохраняют прежние адреса',()=>{
  expect(assetUrl('/assets/realistic/construction-first.png','/')).toBe('/assets/realistic/construction-first.png');
});

test('Pages добавляет подпапку ко всем локальным ресурсам, сохраняя имена и query',()=>{
  expect(assetUrl('/assets/items/button.png?v=1','/true-detective/')).toBe('/true-detective/assets/items/button.png?v=1');
  expect(assetUrl('/assets/items/button.png','./')).toBe('./assets/items/button.png');
});

test('внешние, прозрачные data-ресурсы и пустые адреса не получают префикс',()=>{
  for(const source of ['https://example.org/a.png','//example.org/a.png','data:image/png;base64,AAA','relative.png','']) {
    expect(assetUrl(source,'/true-detective/')).toBe(source);
  }
});

test('фон, портрет и крупный план используют адрес подпапки в реальной разметке',()=>{
  vi.stubEnv('BASE_URL','/true-detective/');
  const scene=renderToStaticMarkup(createElement(ArtworkImage,{src:'/assets/finale/courtroom.png',alt:'Суд'}));
  const portrait=renderToStaticMarkup(createElement(Portrait,{character:'NORA',alt:'Нора'}));
  const item=renderToStaticMarkup(createElement(ItemArtwork,{kind:'coat'}));
  expect(scene).toContain('src="/true-detective/assets/finale/courtroom.png"');
  expect(portrait).toContain('src="/true-detective/assets/portraits/realistic/nora-neutral.png"');
  expect(item).toContain('href="/true-detective/assets/items/coat-lower-button.png"');
});
