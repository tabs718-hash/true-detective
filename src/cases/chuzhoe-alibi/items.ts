export type ItemKind = 'wrench' | 'button' | 'coat';
export type ItemView = { label: string; text: string; frame: [number, number, number, number] };

export const sceneItemArt: Record<ItemKind, { src: string; width: number; height: number }> = {
  wrench: { src: '/assets/items/sprites/wrench.png', width: 1774, height: 887 },
  button: { src: '/assets/items/sprites/button.png', width: 1254, height: 1254 },
  coat: { src: '/assets/items/sprites/coat.png', width: 1075, height: 1464 }
};

// Crops are display viewports into the original image, not new evidence or lab results.
export const itemArt: Record<ItemKind, { src: string; alt: string; width: number; height: number; views: [ItemView, ItemView] }> = {
  button: {
    src: '/assets/items/button.png', alt: 'Тёмная пуговица с четырьмя отверстиями, обрывками нити и потёртым ободком', width: 1536, height: 1024,
    views: [
      { label: 'Изнанка и нити', text: 'В отверстиях и у края застряли светлые обрывки нити. Один конец неровный. Это наблюдение, а не заключение о происхождении предмета.', frame: [490, 310, 780, 520] },
      { label: 'Отделка края', text: 'По ободку проходит тонкая декоративная канавка. На тёмной поверхности заметны потёртости и небольшой дефект отделки.', frame: [900, 260, 540, 360] }
    ]
  },
  wrench: {
    src: '/assets/items/wrench.png', alt: 'Стальной гаечный ключ с потёртостями, следами захвата и небольшими бурыми пятнами', width: 1536, height: 1024,
    views: [
      { label: 'Рукоять', text: 'На металле видны следы захвата. Установить их принадлежность одним осмотром нельзя.', frame: [540, 300, 750, 500] },
      { label: 'Бурые брызги', text: 'Небольшие пятна на головке и возле рукояти. Само их присутствие ещё не определяет, как использовали ключ.', frame: [0, 430, 780, 520] }
    ]
  },
  coat: {
    src: '/assets/items/coat.png', alt: 'Тёмное пальто с тремя сохранившимися пуговицами и одним повреждённым креплением', width: 1536, height: 1024,
    views: [
      { label: 'Повреждённое крепление', text: 'На месте одной пуговицы остались короткие нити. Несколько волокон ткани вытянуты, словно крепление испытало натяжение.', frame: [590, 280, 420, 280] },
      { label: 'Ткань и отделка', text: 'Плотная тёмная ткань, машинные швы и сохранившиеся застёжки. Обстоятельства повреждения по одному виду пальто не установить.', frame: [750, 510, 600, 400] }
    ]
  }
};
