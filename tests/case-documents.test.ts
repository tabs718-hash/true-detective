import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import { caseDocuments } from '../src/cases/chuzhoe-alibi/documents';
import { cards } from '../src/engine/case';
import { DocumentFacsimile } from '../src/ui/DocumentFacsimile';
import { buildFinale } from '../src/cases/chuzhoe-alibi/court';
import { EndingPlayer } from '../src/features/EndingPlayer';
import { selectPacket, submitCase } from '../src/engine/engine';
import { beforeAffair } from './routes';
import { dialogueFor } from '../src/cases/chuzhoe-alibi/content';

const read = (id:string, availableCardIds:readonly string[]=[id]) => renderToStaticMarkup(createElement(DocumentFacsimile,{id,availableCardIds}));
const core = ['R_BUTTON_MATCH','E_BUTTON','E_COAT','D_DIARY','D_FIRING','W_NORA_SERIOUS','R_DELAYED'];

test('каждый документ и отчёт имеет собственный читаемый материал, показания остаются протоколами', () => {
  const expected = Object.values(cards).filter(card=>card.type==='document'||card.type==='forensic').map(card=>card.id);
  expect(Object.keys(caseDocuments).sort()).toEqual(expected.sort());
  for (const id of expected) {
    const markup=read(id);
    expect(markup).toContain(caseDocuments[id].heading);
    expect(markup).toContain('В ДЕЛЕ');
    expect(markup).not.toMatch(/20:18|truthGuards|неизменные ограничения/);
  }
  expect(read('E_BUTTON')).toBe('');
  expect(read('W_EDDIE')).toBe('');
});

test('неполученный или невыбранный документ не открывается даже по существующему ID', () => {
  for (const id of Object.keys(caseDocuments)) expect(read(id,[])).toBe('');
  expect(read('R_DELAYED',['D_AUTOPSY'])).toBe('');
  expect(read('R_BUTTON_MATCH',['D_DIARY'])).toBe('');
  expect(read('UNKNOWN',['UNKNOWN'])).toBe('');
});

test('ранние материалы не сообщают поздние медицинские выводы, роман или владельца аренды', () => {
  expect(read('D_AUTOPSY')+read('D_SCENE_PHOTOS')).not.toMatch(/отсроч|после травмы.*жив|21:25|21:15|20:30|Нора/);
  expect(read('D_RENT_TALLY')+read('D_APT_ADDRESS')).not.toMatch(/Нора|роман|Дэниел|21:/);
  expect(read('D_MARLOWE_OWNER')).not.toContain('Милуоки');
  expect(read('D_DIARY')).toContain('20:30');
  expect(read('D_DIARY')).toContain('Отметки о фактическом посещении нет');
});

test('каждое экспертное заключение показывает пределы, не определяет виновника или точный час травмы', () => {
  for (const [id,data] of Object.entries(caseDocuments).filter(([,record])=>record.form==='report')) {
    expect(data.sections.some(section=>section.heading==='Материалы')).toBe(true);
    expect(data.sections.some(section=>section.heading==='Вывод')).toBe(true);
    expect(data.sections.some(section=>section.heading==='Пределы вывода')).toBe(true);
    expect(read(id)).not.toMatch(/Нора толкнула|точно в 20:|ДНК|стопроцент|абсолютно идентич/);
  }
  expect(read('R_WRENCH')).toContain('не решает вопрос о виновности');
  expect(read('R_BUTTON_MATCH')).toContain('Вероятность принадлежности');
  expect(read('R_BUTTON_MATCH')).toContain('не определяет намерений');
  expect(read('R_EDDIE_COMPAT')).toContain('не превращает свидетельскую оценку времени');
});

test('финал использует исторический §9-3, не подменяя безрассудность одним отсутствием плана', () => {
  const sequence=buildFinale({defendant:'NORA',selectedCardIds:core});
  const decision=sequence.scenes.find(scene=>scene.id==='nora-decision')!;
  const text=decision.paragraphs.join(' ');
  expect(text).toContain('involuntary manslaughter');
  expect(text).toContain('§9-3');
  expect(text).toContain('не только отсутствие плана');
  expect(text).not.toMatch(/second-degree|второй степени|осуждена на|\d+ лет|она призналась|Я толкнула/);
  expect(sequence.scenes.findIndex(scene=>scene.id==='nora-corridor')).toBeGreaterThan(sequence.scenes.indexOf(decision));
  expect(buildFinale({defendant:'NORA',selectedCardIds:['D_DIARY']}).scenes.some(scene=>scene.paragraphs.join(' ').includes('§9-3'))).toBe(false);
});

test('карточки при просмотре финала доступны только из переданного пакета, даже если архив полон', () => {
  const game=beforeAffair();
  game.collectedCards.push('R_WRENCH');
  const ended=submitCase(selectPacket(game,{defendant:'BRENNAN',selectedCardIds:['W_OWEN','W_BRENNAN_1','E_WRENCH','W_NORA_INITIAL']}));
  const markup=renderToStaticMarkup(createElement(EndingPlayer,{game:ended,onProgress(){},onNewGame(){},notice(){}}));
  expect(markup).not.toContain('Исследование гаечного ключа');
  expect(markup).not.toContain('Сравнительное исследование');
  expect(read('R_WRENCH',ended.casePacket.selectedCardIds)).toBe('');
});

test('лаборатория не выводит производственную партию ткани и сохраняет вероятностную оценку', () => {
  const transcript=JSON.stringify(dialogueFor('A_BUTTON_GET',{collectedCards:[]}));
  expect(transcript).not.toContain('партия ткани');
  expect(transcript).toContain('Вероятность этого высока');
  expect(transcript).toContain('не скажу, кто, когда');
});
