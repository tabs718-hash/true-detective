import { Children, createElement, isValidElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test, vi } from 'vitest';
import { initialState, perform, travel, addBoardCard, selectPacket, submitCase } from '../src/engine/engine';
import { addNote } from '../src/engine/notebook';
import { saveSnapshot, hasUnsavedChanges, guardUnsavedChanges } from '../src/persistence/manual-save-status';
import { gameShortcut } from '../src/ui/shortcuts';
import { dialogueAdvance } from '../src/ui/dialogue-controls';
import { dialogueFor, presentationReaction } from '../src/cases/chuzhoe-alibi/content';
import { Board } from '../src/features/Board';
import { BoardCard } from '../src/features/BoardCard';
import { PlayingGuide } from '../src/features/PlayingGuide';

const started = () => travel(perform(initialState(), 'A_START'), 'CONSTRUCTION', 'gate');

test('новая партия требует записи, прочитанный без изменений снимок остаётся сохранённым', () => {
  const game = started(), snapshot = saveSnapshot(game);
  expect(hasUnsavedChanges(null, null)).toBe(false);
  expect(hasUnsavedChanges(game, null)).toBe(true);
  expect(hasUnsavedChanges(structuredClone(game), snapshot)).toBe(false);
  expect(hasUnsavedChanges(travel(game, game.location, game.room), snapshot)).toBe(false);
});

test('заметки, изъятие, положение доски, пакет и поездка требуют нового ручного сохранения', () => {
  const game = travel(started(), 'CONSTRUCTION', 'stairs');
  const snapshot = saveSnapshot(game);
  const observed = perform(game, 'A_OBSERVE_BUTTON');
  const collected = perform(observed, 'A_COLLECT_BUTTON');
  const pinned = addBoardCard(collected, 'E_BUTTON');
  const moved = structuredClone(pinned); moved.board.nodes[0].x += 20;
  for (const state of [addNote(game, 'Проверить показания.'), observed, collected, pinned, travel(game, 'POLICE', 'desk')]) {
    expect(hasUnsavedChanges(state, snapshot)).toBe(true);
  }
  expect(hasUnsavedChanges(moved, saveSnapshot(pinned))).toBe(true);
  const packet = selectPacket(collected, {defendant:'NORA',selectedCardIds:['E_BUTTON']});
  expect(hasUnsavedChanges(packet, saveSnapshot(collected))).toBe(true);
});

test('запись старого снимка не помечает более поздние изменения сохранёнными', () => {
  const saved = started(), changed = addNote(saved, 'Новая запись во время сохранения.');
  expect(hasUnsavedChanges(changed, saveSnapshot(saved))).toBe(true);
  expect(hasUnsavedChanges(changed, saveSnapshot(changed))).toBe(false);
  expect(hasUnsavedChanges(saved, saveSnapshot(saved))).toBe(false);
});

test('сохранённый финал не вызывает предупреждения ручного слота', () => {
  const ended = submitCase(selectPacket(started(), {defendant:'NORA',selectedCardIds:[]}));
  expect(hasUnsavedChanges(ended, null)).toBe(false);
  expect(hasUnsavedChanges({...ended, endingProgress:3}, saveSnapshot(started()))).toBe(false);
});

function unload() {
  const event = new Event('beforeunload', {cancelable:true});
  Object.defineProperty(event, 'returnValue', {value:null,writable:true});
  return event;
}

test('предупреждение ставится только для несохранённой партии и снимается при очистке', () => {
  const target = new EventTarget();
  const clean = guardUnsavedChanges(target, false);
  const first = unload(); target.dispatchEvent(first); expect(first.defaultPrevented).toBe(false); clean();
  const release = guardUnsavedChanges(target, true);
  const changed = unload(); target.dispatchEvent(changed); expect(changed.defaultPrevented).toBe(true); expect(changed.returnValue).toBe(true);
  release();
  const after = unload(); target.dispatchEvent(after); expect(after.defaultPrevented).toBe(false);
});

const key = (overrides: Partial<KeyboardEvent> = {}) => ({key:'s',ctrlKey:true,metaKey:false,altKey:false,repeat:false,isComposing:false,...overrides});

test('сохранение доступно с Ctrl и Command в двух раскладках, модальное окно не прерывается', () => {
  for (const letter of ['s','S','ы','Ы']) {
    expect(gameShortcut(key({key:letter}), true, false, false)).toBe('save');
    expect(gameShortcut(key({key:letter,ctrlKey:false,metaKey:true}), true, false, false)).toBe('save');
  }
  expect(gameShortcut(key(), true, true, false)).toBe('blocked');
  expect(gameShortcut(key(), true, false, true)).toBe('blocked');
  expect(gameShortcut(key({repeat:true}), true, false, false)).toBe('blocked');
  expect(gameShortcut(key(), false, false, false)).toBeNull();
  expect(gameShortcut(key({altKey:true}), true, false, false)).toBeNull();
  expect(gameShortcut(key({isComposing:true}), true, false, false)).toBeNull();
  expect(gameShortcut(key({ctrlKey:false}), true, false, false)).toBeNull();
  expect(gameShortcut(key({key:'F1',ctrlKey:false}), false, false, false)).toBe('guide');
});

test('последняя печатающаяся реплика сначала раскрывается, затем завершает разговор', () => {
  const last = {readOnly:false,all:false,last:true,typing:true};
  expect(dialogueAdvance(last)).toBe('reveal');
  expect(dialogueAdvance({...last,typing:false})).toBe('finish');
  expect(dialogueAdvance({...last,last:false,typing:false})).toBe('next');
  expect(dialogueAdvance({...last,all:true})).toBe('finish');
  expect(dialogueAdvance({...last,readOnly:true})).toBe('close');
});

test('чтение полной карточки с доски не сдвигает её и не меняет материалы дела', () => {
  const observed = perform(travel(started(), 'CONSTRUCTION', 'stairs'), 'A_OBSERVE_BUTTON');
  const game = addBoardCard(perform(observed, 'A_COLLECT_BUTTON'), 'E_BUTTON');
  const onCard = vi.fn(), onMove = vi.fn(), before = structuredClone(game);
  const tree = BoardCard({node:game.board.nodes[0],selected:false,onRead:onCard,onMove,onPin:()=>{},onDrag:()=>{},onContext:()=>{}});
  expect(renderToStaticMarkup(createElement(Board,{game,setGame:()=>{},notice:()=>{},onCard}))).toContain('Прочитать карточку:');
  let read: (()=>void)|undefined;
  function walk(node: ReactNode) {
    Children.forEach(node, child=>{
      if (!isValidElement<Record<string,unknown>>(child)) return;
      if (child.type === 'button' && child.props.className === 'card-read') read = child.props.onClick as ()=>void;
      if (child.props.children) walk(child.props.children as ReactNode);
    });
  }
  walk(tree);
  expect(read).toBeDefined(); read!();
  expect(onCard).toHaveBeenCalledWith('E_BUTTON');
  expect(onMove).not.toHaveBeenCalled(); expect(game).toEqual(before);
});

test('памятка описывает управление без имён, скрытых находок и инструкций к победе', () => {
  const markup = renderToStaticMarkup(createElement(PlayingGuide, {onClose:()=>{}}));
  expect(markup).toContain('Автосохранения расследования нет');
  expect(markup).toContain('Изъять в дело');
  expect(markup).not.toMatch(/Нора|Бреннан|пуговиц|пальто|R_BUTTON|20:|21:/);
});

test('стрелки двигают выбранную карточку, но не вмешиваются в её кнопки', () => {
  const node = {cardId:'E_BUTTON',x:100,y:120}, onMove = vi.fn();
  const tree = BoardCard({node,selected:false,onRead:()=>{},onMove,onPin:()=>{},onDrag:()=>{},onContext:()=>{}});
  const keydown = tree.props.onKeyDown;
  const article = {}, button = {};
  const preventDefault = vi.fn(), stopPropagation = vi.fn();
  keydown({key:'ArrowRight',target:button,currentTarget:article,preventDefault,stopPropagation});
  expect(onMove).not.toHaveBeenCalled(); expect(preventDefault).not.toHaveBeenCalled();
  keydown({key:'ArrowRight',target:article,currentTarget:article,preventDefault,stopPropagation});
  expect(onMove).toHaveBeenCalledWith(10,0); expect(preventDefault).toHaveBeenCalledOnce(); expect(stopPropagation).toHaveBeenCalledOnce();
  expect(node).toEqual({cardId:'E_BUTTON',x:100,y:120});
});

test('Эдди в допросе и при предъявлении отчёта наблюдает из укрытия, не подходит к Ричарду', () => {
  const dialogue = JSON.stringify(dialogueFor('A_EDDIE', {collectedCards:[]}));
  const reaction = presentationReaction('EDDIE', 'R_DELAYED');
  expect(dialogue).toContain('из-за колонны');
  expect(dialogue).toContain('ничком');
  expect(dialogue).toContain('Я не подходил');
  expect(reaction).toContain('из-за колонны');
  expect(dialogue + reaction).not.toMatch(/я подош[её]л/i);
});
