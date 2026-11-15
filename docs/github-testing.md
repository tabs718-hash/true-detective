# Как запустить «Чужое алиби» из GitHub

Актуальная игра: 0.16. В репозитории находятся исходники, все 67 PNG, сценарные документы, тесты и автоматическая сборка. Готовая папка `dist` создаётся при сборке; устанавливать сервер или базу данных не нужно.

## Вариант 1 — GitHub Pages, играть по ссылке

1. Откройте репозиторий: https://github.com/tabs718-hash/true-detective.
2. Перейдите в **Settings → Pages**. В разделе **Build and deployment → Source** выберите **GitHub Actions**. Сохраните выбор, если GitHub предлагает кнопку сохранения.
3. Откройте **Actions → Publish game to GitHub Pages**. Если Actions отключены, сначала включите их кнопкой GitHub.
4. Нажмите **Run workflow**, выберите ветку **main**, затем ещё раз **Run workflow**.
5. Дождитесь зелёного результата обоих заданий: `build` и `deploy`. Откройте ссылку из задания `deploy` или **Settings → Pages → Visit site**.

Обычный адрес для этого репозитория: https://tabs718-hash.github.io/true-detective/.

До первого успешного `deploy` этот адрес может показывать 404. Workflow сам устанавливает правильный путь к JavaScript и всем изображениям. Он запускает проверку сценария, модульные тесты и сборку, затем публикует игру. Браузерные тесты не запускаются.

Публикация запускается только вручную: обычный push не обновляет Pages. Чтобы опубликовать новую сборку, повторите шаги 3–5. При запросе одобрения среды `github-pages` нажмите **Review deployments → Approve and deploy**.

GitHub Pages для этого публичного репозитория — публичная площадка. Для закрытого тестирования используйте прежний Sites: https://chuzhoe-alibi-playtest.tabs718.chatgpt.site. Его доступ не изменяется.

Сохранения хранятся в браузере отдельно для каждого сайта. Сохранение из Sites не переносится автоматически на Pages или localhost. На новом адресе начните новую игру. Используйте настольный браузер, минимум 1280×720.

## Вариант 2 — локально на компьютере

Установите Node.js 24 LTS и Git. Откройте терминал:

```sh
git clone https://github.com/tabs718-hash/true-detective.git
cd true-detective
npm ci
npm run dev
```

Откройте адрес, который покажет терминал, обычно http://localhost:5173/. Для остановки нажмите Ctrl+C.

Чтобы проверить именно production-сборку:

```sh
npm run build
npm run preview
```

Обычно игра откроется по http://localhost:4173/. Не открывайте `dist/index.html` двойным щелчком: требуется HTTP-сервер, который запускает `npm run preview`.

## Проверки и возможные ошибки

- **Actions → Check game** — проверка исходников после обновления репозитория. Она не публикует сайт.
- **Pages: Not Found / 404 в configure-pages** — вернитесь в Settings → Pages и выберите GitHub Actions, затем повторите workflow.
- **Workflow отсутствует в списке** — проверьте, что открыта основная ветка `main`, обновите страницу Actions.
- **Публикация ожидает одобрения** — откройте запуск и подтвердите `github-pages` через Review deployments.
- **Игра обновилась, а экран старый** — обновите вкладку с Ctrl+Shift+R. Это не удаляет IndexedDB, но несохранённый прогресс может потеряться: сначала сохраните партию.
- **Локальный порт занят** — откройте другой адрес, который выбрал Vite и напечатал в терминале.

Официальные инструкции: [GitHub Pages и Actions](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [публикация Vite на Pages](https://vite.dev/guide/static-deploy.html#github-pages).
