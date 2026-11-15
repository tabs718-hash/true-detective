export type ItemKind = 'wrench' | 'button' | 'coat';
export type ItemView = { label: string; text: string; frame: [number, number, number, number] };

export const sceneItemArt: Record<ItemKind, { src: string; width: number; height: number }> = {
  wrench: { src: '/assets/items/sprites/wrench-bloodied.png', width: 1774, height: 887 },
  button: { src: '/assets/items/sprites/button.png', width: 1254, height: 1254 },
  coat: { src: '/assets/items/sprites/coat-lower-button.png', width: 1060, height: 1484 }
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
    src: '/assets/items/wrench-bloodied.png', alt: 'Стальной гаечный ключ с потёртостями, следами захвата и тёмно-красными следами на головке и рукояти', width: 1536, height: 1024,
    views: [
      { label: 'Рукоять', text: 'На металле видны следы захвата. Установить их принадлежность одним осмотром нельзя.', frame: [540, 300, 750, 500] },
      { label: 'Тёмно-красные пятна', text: 'Тёмно-красные следы на головке и части рукояти. Само их присутствие ещё не определяет, как использовали ключ.', frame: [0, 430, 780, 520] }
    ]
  },
  coat: {
    src: '/assets/items/coat-lower-button.png', alt: 'Тёмное пальто с тремя сохранившимися пуговицами и оторванной нижней пуговицей', width: 1536, height: 1024,
    views: [
      { label: 'Нижнее крепление', text: 'На месте нижней пуговицы остались короткие нити. Несколько волокон ткани вытянуты, словно крепление испытало натяжение.', frame: [590, 530, 420, 280] },
      { label: 'Ткань и отделка', text: 'Плотная тёмная ткань, машинные швы и сохранившиеся застёжки. Обстоятельства повреждения по одному виду пальто не установить.', frame: [750, 510, 600, 400] }
    ]
  }
};
