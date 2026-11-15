import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test, vi } from 'vitest';
import { fullscreenAvailable, toggleFullscreen, watchFullscreen, type FullscreenHost } from '../src/ui/fullscreen';
import { FullscreenControl } from '../src/ui/FullscreenControl';

function makeHost() {
  const target=new EventTarget();
  return Object.assign(target,{
    fullscreenEnabled:true,
    fullscreenElement:null as Element|null,
    documentElement:{requestFullscreen:vi.fn(async()=>{})},
    exitFullscreen:vi.fn(async()=>{})
  });
}

test('вход запускается на корне документа, чтобы в режиме оставались все экраны и окна',async()=>{
  const host=makeHost();
  expect(fullscreenAvailable(host)).toBe(true);
  await toggleFullscreen(host);
  expect(host.documentElement.requestFullscreen).toHaveBeenCalledOnce();
  expect(host.exitFullscreen).not.toHaveBeenCalled();
});

test('повторное действие выходит из активного режима, даже если вход теперь запрещён',async()=>{
  const host=makeHost();host.fullscreenElement={} as Element;host.fullscreenEnabled=false;
  await toggleFullscreen(host);
  expect(host.exitFullscreen).toHaveBeenCalledOnce();
  expect(host.documentElement.requestFullscreen).not.toHaveBeenCalled();
});

test('запрещённый браузером режим и отсутствие API не вызывают неподдерживаемый метод',async()=>{
  const host=makeHost();host.fullscreenEnabled=false;
  expect(fullscreenAvailable(host)).toBe(false);
  expect(fullscreenAvailable(null)).toBe(false);
  await expect(toggleFullscreen(host)).rejects.toThrow('недоступен');
  expect(host.documentElement.requestFullscreen).not.toHaveBeenCalled();
  const missing={...host,fullscreenEnabled:true,documentElement:{}} as unknown as FullscreenHost;
  expect(fullscreenAvailable(missing)).toBe(false);
});

test('отказ Fullscreen API обрабатывается как ошибка, а не как успешное включение',async()=>{
  const host=makeHost();host.documentElement.requestFullscreen.mockRejectedValue(new Error('Denied'));
  await expect(toggleFullscreen(host)).rejects.toThrow('Denied');
  expect(host.fullscreenElement).toBeNull();
});

test('выход через Esc синхронизирует состояние, закрытие настроек удаляет подписку',()=>{
  const host=makeHost(), update=vi.fn();
  const stop=watchFullscreen(host,update);
  host.fullscreenElement={} as Element;host.dispatchEvent(new Event('fullscreenchange'));
  expect(update).toHaveBeenLastCalledWith(true);
  host.fullscreenElement=null;host.dispatchEvent(new Event('fullscreenchange'));
  expect(update).toHaveBeenLastCalledWith(false);
  expect(update).toHaveBeenCalledTimes(2);
  stop();host.dispatchEvent(new Event('fullscreenchange'));
  expect(update).toHaveBeenCalledTimes(2);
});

test('настройка рендерится без автоматического включения и объясняет недоступность',()=>{
  const markup=renderToStaticMarkup(createElement(FullscreenControl));
  expect(markup).toContain('На весь экран');
  expect(markup).toContain('aria-pressed="false"');
  expect(markup).toContain('недоступен в этом окне браузера');
});


test('настройки возвращаются поверх полного экрана с прежней прокруткой',async()=>{
  const host=makeHost(), events:string[]=[];
  const dialog={open:true,isConnected:true,scrollTop:120,
    close(){events.push('close');this.open=false;},
    showModal(){events.push('open');this.open=true;this.scrollTop=0;}
  };
  host.documentElement.requestFullscreen.mockImplementation(async()=>{events.push('fullscreen');});
  await toggleFullscreen(host,dialog);
  expect(events).toEqual(['close','fullscreen','open']);
  expect(dialog.open).toBe(true);expect(dialog.scrollTop).toBe(120);
});

test('при отказе браузера настройки также возвращаются, но удалённое окно не открывается',async()=>{
  const host=makeHost();host.documentElement.requestFullscreen.mockRejectedValue(new Error('Denied'));
  const dialog={open:true,isConnected:true,scrollTop:0,close(){this.open=false;},showModal:vi.fn()};
  await expect(toggleFullscreen(host,dialog)).rejects.toThrow('Denied');
  expect(dialog.showModal).toHaveBeenCalledOnce();
  dialog.open=true;dialog.isConnected=false;dialog.showModal.mockClear();
  await expect(toggleFullscreen(host,dialog)).rejects.toThrow('Denied');
  expect(dialog.showModal).not.toHaveBeenCalled();
});
