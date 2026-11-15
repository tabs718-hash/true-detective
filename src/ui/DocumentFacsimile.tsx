import { documentContents } from '../cases/chuzhoe-alibi/content';

const documents: Record<string, { heading: string; issuer: string; text: string[]; handwritten?: boolean }> = {
  D_DIARY: { heading: 'Личный ежедневник', issuer: 'Ричард Уитмор', handwritten: true, text: [documentContents.D_DIARY, 'Запланированная встреча. Отметки о фактическом посещении нет.'] },
  D_LETTER: { heading: 'Неотправленное письмо', issuer: 'Из ящика домашнего стола', handwritten: true, text: [documentContents.D_LETTER] },
  D_FIRING: { heading: 'Проект распоряжения', issuer: 'Whitmore Development', text: [documentContents.D_FIRING, 'Подпись отсутствует. Документ не оформлен.'] },
  D_INVOICE_COMPARE: { heading: 'Сопоставление закупочных цен', issuer: 'Whitmore Development', text: ['Договорные цены / оплаченные счета.', 'В нескольких позициях оплата превышает договорную и рыночную цену. Сверка выполнена по материалам Ричарда Уитмора.'] },
  D_RENT_TALLY: { heading: 'Арендные платежи', issuer: 'Marlowe Realty', text: ['Повторяющиеся перечисления по разным разделам расчётов.', 'Назначение аренды требует проверки. Точного адреса помещения в ведомости нет.'] },
  D_AUTOPSY: { heading: 'Заключение о вскрытии', issuer: 'Патологоанатом при коронере · округ Кук', text: ['Причина смерти: травма головы.', 'Точная минута смерти по имеющимся данным не установлена. Вывод о механизме травмы требует сопоставления с материалами осмотра.'] }
};

export function DocumentFacsimile({ id }: { id: string }) {
  const data = documents[id];
  if (!data) return null;
  return <details className="document-facsimile">
    <summary>Прочитать документ</summary>
    <div className={'facsimile-paper ' + (data.handwritten ? 'handwritten' : '')}>
      <span className="facsimile-issuer">{data.issuer}</span>
      <h3>{data.heading}</h3>
      {data.text.map((text, i) => <p key={i}>{text}</p>)}
      <span className="facsimile-stamp">КОПИЯ В ДЕЛЕ</span>
    </div>
  </details>;
}
