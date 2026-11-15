import { Children, createElement, isValidElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test, vi } from 'vitest';
import { initialState, perform, travel } from '../src/engine/engine';
import { parseSave } from '../src/persistence/save';
import { Scene } from '../src/features/Scene';
import { SceneEvidence } from '../src/features/SceneEvidence';
import { NewspaperOpening } from '../src/features/NewspaperOpening';
import { sceneDebris } from '../src/cases/chuzhoe-alibi/scene-debris';
import { buildFinale } from '../src/cases/chuzhoe-alibi/court';
import type { GameState } from '../src/engine/types';

function scene(game: GameState) {
  return renderToStaticMarkup(createElement(Scene, {game, onTravel:()=>{}, onAct:()=>{}, onItem:()=>{}, onDetail:()=>{}, onConsult:()=>{}}));
}

test('газета сообщает о находке, оставляя причину и время открытыми до расследования', () => {
  const onContinue = vi.fn();
  const markup = renderToStaticMarkup(createElement(NewspaperOpening, {onContinue}));
  expect(markup).toContain('Ричард Уитмор найден мёртвым на стройке');
  expect(markup).toContain('коронеру округа Кук');
  expect(markup).toContain('1966');
  expect(markup).toContain('К месту происшествия');
  expect(markup).not.toMatch(/Нора|толк|21:|20:|«Ты обещал/);
  expect(onContinue).not.toHaveBeenCalled();
});

test('тело присутствует весь первый осмотр объекта; после отъезда кровь и неизъятые предметы остаются', () => {
  const start = perform(initialState(), 'A_START');
  // An early police visit before seeing the stairs must not remove the body.
  const unvisited = travel(start, 'POLICE', 'desk');
  expect(unvisited.constructionScene).toBe('unvisited');
  const first = travel(unvisited, 'CONSTRUCTION', 'stairs');
  expect(first.constructionScene).toBe('body_present');
  expect(scene(first)).toContain('/assets/realistic/construction-first.png');
  expect(scene(first)).toContain('накрытое брезентом');
  const gate = travel(first, 'CONSTRUCTION', 'gate');
  expect(travel(gate, 'CONSTRUCTION', 'stairs').constructionScene).toBe('body_present');
  const left = travel(gate, 'POLICE', 'desk');
  const returned = travel(left, 'CONSTRUCTION', 'stairs');
  expect(returned.constructionScene).toBe('body_removed');
  expect(scene(returned)).toContain('/assets/realistic/construction-cleared.png');
  expect(scene(returned)).toContain('Тело уже увезли');
  expect(scene(returned)).toContain('wrench-object');
  expect(scene(returned)).toContain('button-object');
  expect(returned.collectedCards).toEqual(start.collectedCards);
  expect(returned.completedActions).toEqual(start.completedActions);
  expect(returned.requests).toEqual(start.requests);
});

test('состояние осмотра переживает сохранение, а старый сейв не теряет материалы', () => {
  const start = perform(initialState(), 'A_START');
  const present = travel(start, 'CONSTRUCTION', 'stairs');
  expect(parseSave(JSON.parse(JSON.stringify(present)))).toEqual(present);
  const removed = travel(present, 'POLICE', 'desk');
  expect(parseSave(JSON.parse(JSON.stringify(removed)))).toEqual(removed);
  const {constructionScene: _oldField, ...legacy} = perform(present, 'A_SCENE_PHOTOS');
  const migrated = parseSave({...legacy, location: 'POLICE', room: 'desk'});
  expect(migrated.constructionScene).toBe('body_removed');
  expect(migrated.collectedCards).toEqual(legacy.collectedCards);
  expect(parseSave({...legacy, location: 'CONSTRUCTION', room: 'stairs'}).constructionScene).toBe('body_present');
  const {constructionScene: _unused, ...early} = start;
  expect(parseSave(early).constructionScene).toBe('unvisited');
});

test('три ложных следа открывают только описание и не запускают осмотр настоящих улик', () => {
  const game = travel(perform(initialState(), 'A_START'), 'CONSTRUCTION', 'stairs');
  const before = structuredClone(game);
  const onItem = vi.fn(), onDetail = vi.fn();
  const tree = SceneEvidence({game,width:1536,height:1024,onItem,onDetail});
  const clicks: (()=>void)[] = [];
  function walk(node: ReactNode) {
    Children.forEach(node, child => {
      if (!isValidElement<Record<string, unknown>>(child)) return;
      if (child.type === 'button' && String(child.props.className).includes('debris-object')) clicks.push(child.props.onClick as ()=>void);
      if (child.props.children) walk(child.props.children as ReactNode);
    });
  }
  walk(tree);
  expect(clicks).toHaveLength(3);
  clicks.forEach(click=>click());
  expect(onItem).not.toHaveBeenCalled();
  expect(onDetail.mock.calls).toEqual(sceneDebris.map(d=>[d.title,d.text]));
  expect(game).toEqual(before);
});

test('реконструкция согласована с высотой лестницы, скрытым Эдди и нижней пуговицей', () => {
  const finale = buildFinale({defendant:'NORA',selectedCardIds:['R_BUTTON_MATCH','E_BUTTON','E_COAT','D_DIARY','D_FIRING','W_NORA_SERIOUS','R_DELAYED']});
  const markup = JSON.stringify(finale);
  expect(markup).toContain('верхней площадке');
  expect(markup).toContain('вниз по металлической лестнице');
  expect(markup).toContain('нижняя пуговица');
  expect(markup).toContain('лежащего ничком');
  expect(markup).toContain('не видит Эдди');
});
