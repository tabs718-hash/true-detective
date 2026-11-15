import { ArrowRight } from 'lucide-react';
import '../ui/newspaper.css';

export function NewspaperOpening({ onContinue }: { onContinue: () => void }) {
  return <main className="newspaper-opening" aria-label="Утренний выпуск газеты">
    <article className="newspaper-sheet">
      <header><div className="newspaper-kicker"><span>Городское издание</span><span>Осень 1966 года</span><span>Цена 10 центов</span></div>
        <p className="newspaper-masthead">Чикагский вестник</p>
        <div className="newspaper-edition"><span>Новости города и округа Кук</span><span>Утренний выпуск</span></div>
      </header>
      <div className="newspaper-story">
        <p className="newspaper-rubric">Происшествия</p>
        <h1>Ричард Уитмор найден мёртвым на стройке</h1>
        <p className="newspaper-deck">Полиция расследует обстоятельства гибели главы строительной компании</p>
        <div className="newspaper-columns"><div>
          <p className="newspaper-byline">От нашего городского корреспондента</p>
          <p className="newspaper-lead">ЧИКАГО. — Тело Ричарда Уитмора, главы строительной компании Whitmore Development, обнаружено сегодня утром на одном из незавершённых объектов фирмы.</p>
          <p>Находку сделал охранник, заступивший на дневную смену. Он известил полицию. Прибывшие сотрудники ограничили доступ к месту происшествия.</p>
        </div><div>
          <p>Следователи приступили к осмотру стройплощадки и опросу работников. В управлении полиции сообщили, что обстоятельства гибели мистера Уитмора пока устанавливаются.</p>
          <p>Вопрос о причине и времени смерти передан коронеру округа Кук. Официальных выводов к моменту выхода номера не поступило.</p>
          <p>Представители компании воздержались от заявлений до получения сведений от властей. Расследование продолжается.</p>
        </div></div>
      </div>
      <footer className="newspaper-footer"><span>Городская хроника · страница 1</span><span>Продолжение — в следующих выпусках</span></footer>
    </article>
    <button className="newspaper-continue" onClick={onContinue}>К месту происшествия<ArrowRight size={18}/></button>
  </main>;
}
