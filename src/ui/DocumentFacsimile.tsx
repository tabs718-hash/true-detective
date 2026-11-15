import { caseDocuments } from '../cases/chuzhoe-alibi/documents';

export function DocumentFacsimile({id, availableCardIds}: {id:string;availableCardIds:readonly string[]}) {
  if (!availableCardIds.includes(id)) return null;
  const data=caseDocuments[id];
  if (!data) return null;
  const report=data.form==='report';
  return <details className="document-facsimile">
    <summary>{report?'Прочитать заключение':'Прочитать документ'}</summary>
    <div className={'facsimile-paper '+(data.handwritten?'handwritten ':'')+(report?'forensic-report':'')}>
      <span className="facsimile-issuer">{data.issuer}</span><h3>{data.heading}</h3>
      {data.form==='extract'&&<p className="facsimile-extract-note">Выдержка из материалов дела</p>}
      {data.sections.map((section,index)=><section key={index}>{section.heading&&<h4>{section.heading}</h4>}{section.paragraphs.map((text,i)=><p key={i}>{text}</p>)}</section>)}
      <span className="facsimile-stamp">{report?'ЗАКЛЮЧЕНИЕ В ДЕЛЕ':data.form==='extract'?'ВЫПИСКА В ДЕЛЕ':'КОПИЯ В ДЕЛЕ'}</span>
    </div>
  </details>;
}
