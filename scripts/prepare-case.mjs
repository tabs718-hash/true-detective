import { readFile, writeFile, mkdir } from 'node:fs/promises';
const spec = JSON.parse(await readFile(new URL('../CASE_SPEC.json', import.meta.url), 'utf8'));
const { truthGuards, implementationNotes, evidence, ...safe } = spec;
void truthGuards; void implementationNotes;
safe.evidence = evidence.map(({summary, playerSummary, ...card}) => {
  void summary;
  if (!playerSummary) throw new Error(`Missing player text: ${card.id}`);
  return {...card, summary: playerSummary};
});
const target = new URL('../src/cases/chuzhoe-alibi/generated.json', import.meta.url);
await mkdir(new URL('.', target), {recursive: true});
await writeFile(target, JSON.stringify(safe, null, 2) + '\n');
console.log(`Подготовлено ${safe.evidence.length} карточек и ${safe.actions.length} действий без авторских ремарок.`);
const script = await readFile(new URL('../DIALOGUES.md', import.meta.url), 'utf8');
const scenes={};
for(const part of script.split(/^## S/gm).slice(1)){
  const id='S'+part.slice(0,2);
  let text=part;
  if(id==='S11')text=text.split('[Повторный допрос')[0];
  if(id==='S09')text=text.split('[Позднее,')[0];
  if(id==='S22')text=text.split('[Если предъявлены')[0];
  if(['S25','S27','S28','S29','S30','S31','S32'].includes(id))continue;
  scenes[id]=text.split('\n').flatMap(line=>{
    const m=line.match(/^(D(?: \(внутренне\))?|N|E|B|H|L|Фрэнк|Оуэн|Кассир|Дэниел|Айрин|Эксперт|Эдди):\s*(.+)$/);
    return m?[{speaker:m[1].replace(' (внутренне)',''),text:m[2].replace(/\s*\[[^\]]*\]/g,'').trim()}]:[];
  });
}
await writeFile(new URL('../src/cases/chuzhoe-alibi/dialogues.json',import.meta.url),JSON.stringify(scenes,null,2)+'\n');
