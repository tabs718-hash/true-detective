export interface SceneArt {
  src: string;
  fallback: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
}

// Presentation only: changing a background never changes case state or evidence.
const realisticScenes: Record<string, string> = {
  construction: 'Незавершённая стройка с металлической лестницей и мокрым бетонным полом',
  police: 'Общий зал участка с деревянными столами, пишущей машинкой и дисковым телефоном',
  office: 'Приёмная компании с деревянной стойкой и стеклянной перегородкой',
  mansion: 'Гостиная особняка с мягкой мебелью и кофейным сервизом',
  gas: 'Кассовая стойка заправки с механической кассой и видом на бензоколонки',
  'secret-apartment': 'Гостиная съёмной квартиры с открытым чемоданом и временной обстановкой',
  'nora-apartment': 'Личная спальня Норы с кроватью, комодом и деревянным стулом',
  prosecutor: 'Отдельный кабинет прокурора с письменным столом и юридическими книгами'
};

export function sceneArt(art: string): SceneArt {
  const fallback = '/assets/' + art + '.svg';
  const description = realisticScenes[art];
  return {
    src: description ? '/assets/realistic/' + art + '.png' : fallback,
    fallback,
    alt: description ? description + ' — Чикаго, 1966 год' : 'Сценографический эскиз помещения эпохи 1960-х годов',
    caption: description ? 'Художественная сцена' : 'Сценографический эскиз',
    width: description ? 1536 : 1600,
    height: description ? 1024 : 1000
  };
}
