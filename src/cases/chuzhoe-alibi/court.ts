import { sceneArt } from './art';
import type { PortraitEmotion } from './portraits';
import { characters } from '../../engine/case';
import { verdict } from '../../engine/verdict';
import type { CasePacket } from '../../engine/types';
import { endings } from './content';

export type FinalePhase = 'transfer' | 'hearing' | 'decision' | 'corridor' | 'reconstruction' | 'epilogue' | 'report';
export interface FinaleScene {
  id: string;
  phase: FinalePhase;
  title: string;
  paragraphs: string[];
  art: string;
  citedCardIds: string[];
  speaker?: string;
  portrait?: { character: string; emotion: PortraitEmotion };
  revealsTruth: boolean;
}
export interface FinaleSequence { outcomeId: string; title: string; scenes: FinaleScene[]; verified: boolean }
export function buildFinale(packet: CasePacket, recordedEnding?: string | null): FinaleSequence {
  const outcome = verdict(packet);
  if (recordedEnding && recordedEnding !== outcome) {
    return { outcomeId: 'UNVERIFIED_RECORD', title: 'Дело закрыто', verified: false, scenes: [{ id: 'closed-record', phase: 'report', title: 'Дело закрыто', paragraphs: ['Эта партия завершена. Возврат к расследованию недоступен.'], art: '/assets/finale/closed-case.png', citedCardIds: [], revealsTruth: false }] };
  }
  const ids = [...new Set(packet.selectedCardIds)];
  const has = (id: string) => ids.includes(id);
  const selected = (...candidates: string[]) => candidates.filter(has);
  const scenes: FinaleScene[] = [];
  const add = (id: string, phase: FinalePhase, title: string, paragraphs: string[], options: Partial<FinaleScene> = {}) => {
    scenes.push({ id, phase, title, paragraphs, art: '/assets/finale/courtroom.png', citedCardIds: [], revealsTruth: false, ...options });
  };
  const title = endings[outcome]?.title ?? 'Дело закрыто';
  const name = characters[packet.defendant]?.name ?? 'Выбранный обвиняемый';
  add('handover', 'transfer', 'Переданная версия', [
    'Вы закрываете папку. С этого момента расследование продолжится уже в решениях других людей.',
    'Обвиняемый: ' + name + '. Для оценки переданы только вручную выбранные материалы.',
    'Проходит время. Материалы проходят необходимые процессуальные стадии, прежде чем по выбранному обвинению принимается решение.'
  ], { art: '/assets/finale/closed-case.png', citedCardIds: ids });

  if (outcome === 'EMPTY_FILE_REPRIMAND') {
    add('empty-review', 'hearing', 'Пустая папка', ['«Где материалы, на которых должно держаться обвинение?» Прокурор не находит того, что можно предъявить суду.', 'Догадка не заменяет доказательств. Обвинение не поддержано.'], { speaker: 'Прокурор', art: sceneArt('prosecutor').src });
    add('empty-consequence', 'decision', 'Расследование прекращено', ['Начальник не повышает голоса: «Оформляйте отпуск. Немедленно». Папка остаётся у него на столе.'], { art: sceneArt('police').src });
    add('empty-report', 'report', title, ['Выбранная версия не получила доказательственного основания. Эта партия завершена.'], { art: '/assets/finale/closed-case.png' });
    return { outcomeId: outcome, title, scenes, verified: true };
  }

  if (outcome === 'NORA_CONVICTED') {
    const motive = has('D_LETTER') ? 'В приложенном неотправленном письме Ричард намерен прекратить отношения и вернуться к жене.' : 'В приложенном проекте распоряжения Ричард намерен уволить Нору. Это проект, не доказательство исполнения.';
    add('nora-documents', 'hearing', 'Личные документы', [motive, 'В ежедневнике назначен последний разговор на западном объекте в 20:30. Запись подтверждает намерение встретиться, а не фактическое прибытие.', has('W_NORA_VISIT') ? 'В приложенных показаниях Нора признала визит и ссору. Причинение травмы она отрицает.' : 'Официальный допрос проведён. Сам факт допроса не является признанием вины.'], { speaker: 'Судья', citedCardIds: selected('D_LETTER', 'D_FIRING', 'D_DIARY', 'W_NORA_VISIT', 'W_NORA_SERIOUS') });
    add('nora-objects', 'hearing', 'Вещь и её происхождение', ['Пуговица с объекта и изъятое пальто представлены вместе с заключением лаборатории.', 'Особенности нитей, ткани и крепления согласуются с высокой вероятностью принадлежности пуговицы пальто. Это связывает предметы, но само по себе не доказывает толчок.'], { speaker: 'Судья', citedCardIds: selected('E_BUTTON', 'E_COAT', 'R_BUTTON_MATCH') });
    const medical: string[] = [];
    if (has('R_DELAYED')) medical.push('Медицинское дополнение допускает падение у металлической конструкции и сохранение жизни некоторое время после травмы. Минуту первоначального падения эксперт не называет.');
    if (has('W_EDDIE')) medical.push('Эдди сообщает, что видел Ричарда ещё живым около 21:25–21:30 по своим часам. Время услышанной ссоры ему неизвестно.');
    if (has('R_EDDIE_COMPAT')) medical.push('Экспертное уточнение признаёт рассказ о позднем дыхании совместимым с медицинской картиной. Это не устанавливает точный час травмы.');
    if (has('W_IRENE')) medical.push('Айрин действительно видела Нору дома около 21:15. Её свидетельство относится к этому моменту и совместимо с более ранним причинением травмы. Противоречия между ним и отсроченной смертью нет.');
    add('nora-medical', 'hearing', 'Два разных момента', medical, { speaker: 'Судья', citedCardIds: selected('R_DELAYED', 'W_EDDIE', 'R_EDDIE_COMPAT', 'W_IRENE') });
    add('nora-decision', 'decision', 'Решение суда', ['Суд оценивает совокупность обстоятельств: личный конфликт, назначенную встречу, исследованные предметы и представленные сведения о состоянии потерпевшего после травмы.', 'Нора признана виновной в причинении смертельной травмы. Решение об ответственности не означает автоматического вывода о заранее обдуманном умысле на убийство.'], { speaker: 'Судья', citedCardIds: ids });
    add('nora-corridor', 'corridor', 'После вердикта', ['В коридоре Нора долго молчит. Потом говорит: «Я толкнула его. Сильно. Потому что он говорил, будто всех этих лет не было».', '«Я не знала, что он умрёт. Я хотела, чтобы он перестал говорить. Не чтобы он умер».'], { speaker: 'Нора', portrait: { character: 'NORA', emotion: 'concerned' }, art: '/assets/finale/corridor.png', revealsTruth: true });
    add('truth-argument', 'reconstruction', 'Последний разговор', ['Ранее тем же вечером. На верхней площадке металлической лестницы Ричард подтверждает разрыв и намерение уволить Нору. Разговор, который она надеялась изменить, становится окончательным.'], { art: '/assets/finale/argument-upper.png', revealsTruth: true });
    add('truth-fall', 'reconstruction', 'На верхней площадке', ['Нора толкает Ричарда во время ссоры на верхней площадке. Он теряет опору у края ступеней, падает вниз по металлической лестнице и получает травму головы.', 'Она бежит. С пальто отрывается нижняя пуговица. Ричард остаётся без помощи; смерть не наступает мгновенно.'], { art: '/assets/finale/fall-upper.png', revealsTruth: true });
    add('truth-home', 'reconstruction', 'Правдивое алиби', ['Около 21:15 Айрин действительно встречает Нору дома. Соседка никого не прикрывает и не лжёт.', 'Алиби подтверждало, где Нора находилась в этот момент. Оно не отвечало на вопрос о том, что случилось раньше.'], { art: '/assets/finale/home-lower-button.png', revealsTruth: true });
    add('truth-eddie', 'reconstruction', 'Помощь, которую не позвали', ['Эдди, скрывавшийся после кражи материалов, просыпается и из-за колонны украдкой замечает Ричарда, лежащего ничком у подножия лестницы. Тот ещё дышит, но не поднимает головы и не видит Эдди. Боится быть пойманным и уходит, не вызвав помощь.', 'Ричард умирает позднее. Эдди не был очевидцем толчка; его отказ помочь не делает его человеком, нанёсшим исходную травму.'], { art: '/assets/finale/alive-prone.png', revealsTruth: true });
    const epilogue = ['Элизабет остаётся с примирением, которое не успело стать жизнью. Верный ответ не возвращает ей утраченного.'];
    if (has('W_DANIEL_EXPOSED')) epilogue.push('Финансовая роль Дэниела получила отдельное документальное основание. Махинации рассматриваются отдельно от смерти Ричарда.');
    if (has('W_BRENNAN_FIN')) epilogue.push('Бреннан отвечает за свои финансовые поступки отдельно. Его угрозы не стали доказательством того, чего он не делал.');
    epilogue.push('Детектив закрывает папку: «Её алиби было настоящим. Ошибка была в вопросе, на который мы пытались им ответить».');
    add('true-epilogue', 'epilogue', 'Чужое алиби', epilogue, { art: sceneArt('mansion').src, revealsTruth: true });
  } else if (packet.defendant === 'BRENNAN') {
    const hearing = ['Суд оценивает связь приложенных материалов с действием, от которого потерпевший получил травму.'];
    if (has('W_OWEN')) hearing.push('Приложенные показания Оуэна подтверждают публичные угрозы. Угроза ещё не устанавливает действие в ночь смерти.');
    if (has('W_BRENNAN_1')) hearing.push('В приложенном протоколе Бреннан признаёт визит на объект, но отрицает причинение травмы.');
    if (has('E_WRENCH')) hearing.push('В пакет включён ключ, обнаруженный у лестницы. Обвинение связывает его со следами и конфликтом Бреннана.');
    if (has('R_WRENCH')) hearing.push('Приложенное экспертное заключение исключает ключ как источник травмы. Его наличие противоречит версии об ударе этим предметом.');
    add('brennan-hearing', 'hearing', 'Угроза и предмет', hearing, { speaker: 'Судья', citedCardIds: selected('W_OWEN', 'W_BRENNAN_1', 'E_WRENCH', 'R_WRENCH', 'W_ELIZABETH_1', 'W_NORA_INITIAL', 'W_FRANK') });
    if (outcome === 'BRENNAN_WRONGFUL_CONVICTION') {
      add('brennan-decision', 'decision', 'Обвинительная версия принята', ['Суд принимает представленную неполную цепочку. Бреннан осуждён.', '«Я делал грязные дела со счетами. Но к его смерти это не имеет отношения», — повторяет он.'], { citedCardIds: ids, portrait: { character: 'BRENNAN', emotion: 'guarded' } });
      add('brennan-consequence', 'epilogue', 'Удобный виновный', ['Удобная история закрывается быстрее, чем сложная. Только от этого она не становится правдой.', 'Ошибка в неполном деле получает силу приговора. Для Бреннана она становится жизнью, которую нельзя вернуть на место одной подписью.'], { art: '/assets/finale/corridor.png' });
    } else {
      add('brennan-decision', 'decision', 'Обвинение не доказано', ['Выбранный пакет не устанавливает достаточной связи Бреннана с причинением смертельной травмы. Он оправдан по этому обвинению.'], { citedCardIds: ids });
      add('brennan-corridor', 'corridor', 'За дверью суда', [has('W_BRENNAN_FIN') ? 'Бреннан не благодарит детектива. «Мои счета — мои счета. Но я говорил вам о другом». Финансовые вопросы остаются отдельными.' : 'Бреннан не благодарит детектива. «Вы были слишком уверены в своей версии», — говорит он перед уходом.'], { art: '/assets/finale/corridor.png', portrait: { character: 'BRENNAN', emotion: 'firm' } });
    }
  } else if (packet.defendant === 'NORA') {
    const hearing = ['Суд рассматривает представленные материалы. Возможный мотив или изменение прежних показаний не заменяют доказательства действия, причинившего травму.'];
    if (has('D_DIARY')) hearing.push('Запись в ежедневнике подтверждает план встречи, а не факт её проведения.');
    if (has('R_BUTTON_MATCH')) hearing.push('Соответствие предметов не устанавливает само по себе обстоятельства происшествия.');
    if (has('W_IRENE')) hearing.push('Свидетельство Айрин о встрече дома не опровергнуто. Оно относится только к тому, что она наблюдала.');
    add('nora-insufficient', 'hearing', 'Пределы предположения', hearing, { speaker: 'Судья', citedCardIds: selected('D_DIARY', 'R_BUTTON_MATCH', 'W_IRENE') });
    add('nora-acquittal', 'decision', 'Недостаточно оснований', ['Представленных материалов недостаточно, чтобы признать обвиняемую виновной в причинении смертельной травмы. Нора оправдана.'], { speaker: 'Судья', citedCardIds: ids });
    add('nora-departure', 'corridor', 'Последний ответ', ['Нора отвечает ровно: «Я больше не хочу обсуждать его смерть». Дверь закрывается.'], { art: '/assets/finale/corridor.png', portrait: { character: 'NORA', emotion: 'neutral' } });
  } else if (packet.defendant === 'ELIZABETH') {
    add('elizabeth-hearing', 'hearing', 'Мотив не равен действию', ['Представленные материалы не устанавливают действие, от которого потерпевший получил травму.', ...(has('D_INSURANCE') ? ['Приложенный страховой полис не доказывает причинение смерти.'] : []), ...(has('D_DIVORCE') ? ['Консультация по разводу подтверждает семейные разногласия, а не нападение.'] : []), ...(has('W_ELIZABETH_2') ? ['Рассказ о поездке к воротам не устанавливает присутствие у лестницы в момент травмы.'] : [])], { speaker: 'Судья', citedCardIds: selected('D_INSURANCE', 'D_DIVORCE', 'W_ELIZABETH_2', 'W_ELIZABETH_AFFAIR') });
    add('elizabeth-decision', 'decision', 'Элизабет оправдана', ['Обвинение не доказало причинение смертельной травмы Элизабет. Суд выносит оправдательное решение.'], { citedCardIds: ids });
    add('elizabeth-corridor', 'corridor', 'Тень подозрения', ['«Вы искали причину, по которой меня можно ненавидеть. У вас получилось. Остальное вы не доказали».'], { art: '/assets/finale/corridor.png', speaker: 'Элизабет', portrait: { character: 'ELIZABETH', emotion: 'concerned' } });
  } else {
    let explanation = 'В выбранных материалах не установлена достаточная связь обвиняемого с нанесением травмы.';
    if (packet.defendant === 'DANIEL') explanation = has('D_DANIEL_ALIBI') ? 'Представленные сведения подтверждают деловую поездку Дэниела в Милуоки. Финансовая роль не делает его виновным в смерти отца.' : has('D_INVOICE_COMPARE') || has('W_DANIEL_EXPOSED') || has('D_MARLOWE_OWNER') ? 'Сведения о финансовых операциях не устанавливают, что Дэниел нанёс травму. Эти вопросы нельзя подменять друг другом.' : 'Приложенные материалы не устанавливают, что Дэниел нанёс травму.';
    if (packet.defendant === 'EDDIE') explanation = has('W_EDDIE') ? 'В приложенном протоколе Эдди признаёт кражу и отказ помочь. Эти поступки не доказывают нанесение исходной травмы; их возможная правовая оценка рассматривается отдельно.' : 'Приложенные материалы не устанавливают, что Эдди причинил исходную травму.';
    if (packet.defendant === 'HAYES') explanation = has('W_HAYES_1') ? 'В приложенных показаниях описаны наблюдения у ворот. Они не устанавливают виновность самого сторожа.' : 'Приложенные материалы не устанавливают нападение со стороны Хейза.';
    add('unsupported-hearing', 'hearing', 'Где связь с травмой?', [explanation], { citedCardIds: ids, speaker: 'Прокурор', art: sceneArt('prosecutor').src });
    add('unsupported-decision', 'decision', 'Обвинение не поддержано', ['Материалы не дают достаточного основания поддержать обвинение в причинении смерти. Дело закрывается в рамках выбранной версии.'], { art: '/assets/finale/courtroom.png' });
    add('unsupported-consequence', 'epilogue', 'Слишком мало', ['Начальник возвращает детективу служебные бумаги: «Ваше расследование зашло слишком далеко от доказательств. Оформляйте отпуск».'], { art: sceneArt('police').src });
  }
  add('final-report', 'report', title, ['Расследование завершено. Папка содержит выбранную вами версию и её последствия.'], { art: '/assets/finale/closed-case.png', revealsTruth: outcome === 'NORA_CONVICTED' });
  return { outcomeId: outcome, title, scenes, verified: true };
}
