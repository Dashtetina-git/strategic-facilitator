# Сайт Daria — Strategic Facilitator

Статический сайт по макету Figma «Daria's stuff» (страница `landing`): десктоп 1280 px и мобилка 393 px.
Сборщик не нужен: папку `site/` можно целиком загрузить на любой хостинг (Netlify, Vercel, GitHub Pages, Cloudflare Pages, любой обычный хостинг).

## Запустить локально

```bash
cd site && python3 -m http.server 4321
```

Затем откройте http://localhost:4321

## Что заменить перед публикацией

| Что | Где | Сейчас |
|---|---|---|
| Домен | `index.html`, `ru/index.html`, `robots.txt`, `sitemap.xml` | `https://example.com` — заменяется одной командой `./set-domain.sh вашдомен.com` |
| Полное имя | везде указано: Daria Ponomareva / Дарья Пономарёва | — |

## Русская версия

- Страница: `ru/index.html` (адрес `/ru/`). Тексты переведены, раскладка та же, что у английской.
- Заголовки набраны шрифтом EB Garamond ExtraBold Italic из Google Fonts, потому что в Armany нет кириллицы. Цифры «1» и «2» остаются шрифтом Armany.
- Версии связаны между собой: в `<head>` обеих страниц стоят `hreflang` (en / ru / x-default), в `sitemap.xml` перечислены обе страницы. Видимого переключателя языка нет: каждая версия открывается по своему адресу (`/` и `/ru/`).
- Если меняете английский текст, русский нужно поправить отдельно в `ru/index.html`.

## Ссылки на сайте

| Что | Куда ведёт |
|---|---|
| «Book a call» ×2, «Free consultation call» | https://calendly.com/daria_p/new-meeting (в новой вкладке) |
| Почта в подвале | письмо на dashtetina@gmail.com с темой «Facilitation» |
| LinkedIn | https://www.linkedin.com/in/strategic-facilitator/ |
| Telegram | https://t.me/dashtetina |
| WhatsApp | https://wa.me/995598668856 |

## После публикации

1. Добавить сайт в Google Search Console и Яндекс.Вебмастер, подтвердить права и отправить `https://<домен>/sitemap.xml`.
2. Проверить превью ссылки: https://www.opengraph.xyz и в Telegram.
3. Проверить разметку: https://validator.schema.org и https://search.google.com/test/rich-results
4. При желании подключить аналитику (Яндекс.Метрика / Plausible / GA4).

## Устройство

- `assets/styles.css` — каждому элементу заданы координаты из Figma через переменные `--x --y --w --h` (десктоп) и `--mx --my --mw --mh` (мобилка). Одна единица `--u` равна одному пикселю макета, поэтому всё масштабируется по ширине экрана.
- Красная нить — SVG из Figma (`assets/img/d-thread.svg`, `m-thread.svg`).
- Шрифт заголовков — Armany Semibold (`assets/fonts`). Основной текст — Helvetica Neue Light (системный шрифт на Mac и iPhone; на Windows и Android подставится Helvetica или Arial).
