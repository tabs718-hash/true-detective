export interface SceneArt {
  src: string;
  fallback: string;
  alt: string;
  caption: string;
}

// Presentation only: changing a background never changes case state or evidence.
const realisticScenes: Record<string, string> = {
  construction: 'Незавершённая стройка с металлической лестницей и мокрым бетонным полом',
  police: 'Общий зал участка с деревянными столами, пишущей машинкой и дисковым телефоном',
  office: 'Приёмная компании с деревянной стойкой и стеклянной перегородкой',
  mansion: 'Гостиная особняка с мягкой мебелью и кофейным сервизом'
};

export function sceneArt(art: string): SceneArt {
  const fallback = '/assets/' + art + '.svg';
  const description = realisticScenes[art];
  return {
    src: description ? '/assets/realistic/' + art + '.png' : fallback,
    fallback,
    alt: description ? description + ' — Чикаго, 1966 год' : 'Сценографический эскиз помещения эпохи 1960-х годов',
    caption: description ? 'Художественная сцена' : 'Сценографический эскиз'
  };
}
