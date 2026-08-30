# Self-profiling API Demo

Демо для доклада на HolyJS: JS Self-Profiling API → обработка Profile → Perfetto и Flamegraph.

## Быстрый старт

```bash
npm run init:submodules
npm install
npm run preview   # production build + source maps + Document-Policy: js-profiling
```

Открой приложение (обычно http://localhost:4173):

| Route         | Смысл                                                                   |
|---------------|-------------------------------------------------------------------------|
| `/inp`        | Live Scenario: тяжёлое взаимодействие, strip вокруг events, авто-upload |
| `/load`       | Автостарт → stop на load / soft window, авто-upload                     |
| `/scroll`     | Тяжёлый скролл, автостарт, авто-upload                                  |
| `/flamegraph` | Свежие SVG после `fold`                                                 |

На stage build **не** используется `react-dom/profiling` (см. ADR 0002). Опционально: `npm run preview:profiling`.

## Флоу обработки

1. На `/inp` — Старт → взаимодействие → Стоп → payload (gzip+base64 `.txt`) в `profiles/`.
2. В `profiles/` заранее можно положить ещё несколько payload-файлов для демонстрации агрегации профилей (fold).
3. Терминал:

```bash
npm run process-profile -- download-maps profiles
npm run process-profile -- traces profiles
# открой нужный *.trace.json в https://ui.perfetto.dev/
npm run process-profile -- fold profiles
# SVG появятся в profiles/; в демо страница /flamegraph
```

Вход CLI — **много** `.txt` payload. См. ADR 0001. Перед обработкой дополнительно чистятся и анонимизируются адреса
ресурсов в `cleanupResource()` — есть смысл заглянуть туда и настроить под себя.

Команды CLI:

### download-maps

`npm run process-profile -- download-maps ./profiles`

Скачивает source maps для указанных в профилях файлов и сохраняет в `./profiles/source-maps/`. Скачка инкрементальная:
если source map уже есть — он не скачивается повторно.

### fold

`npm run process-profile -- fold ./profiles`

Агрегирует все профили в один, записывает его в формате stackcollapse (`*.txt`) в нескольких видах:

- `*-folded-all-reversed.txt` - одинаковые стеки сгруппированы вместе, последняя вызванная функция внизу
- `*-folded-all.txt` - одинаковые стеки сгруппированы вместе
- `*-folded-modules-1st-party.txt` - одинаковые файлы сгруппированы вместе, без библиотек (react)
- `*-folded-modules.txt` - одинаковые файлы сгруппированы вместе
- `*-folded-without-react.txt` - без библиотек (react)

Далее запускает `flamegraph.pl` (submodule) и получает SVG.

### traces

`npm run process-profile -- traces ./profiles`

Создаёт по одному Chrome Trace на каждый payload.

### resources

`npm run process-profile -- resources ./profiles`

Вспомогательная команда. Строит отсортированный список уникальных ресурсов и записывает его в файл `*-resources.txt`.

### merge

`npm run process-profile -- merge ./profiles`

Вспомогательная команда. Объединяет 20 самых тяжёлых профилей в один и записывает его в формате Chrome Trace (`*.trace.json`).

### top

`npm run process-profile -- top ./profiles`

Получает топ-5 профилей по соотношению количества сэмплов к количеству событий ввода, то есть профили, в которых
на одно событие было наибольшее количество наблюдаемой активности.

Для каждого профиля из топа создаёт файлы

- JSON с данными профиля в том формате, в котором они пришли с клиента. На всякий случай. Для дальнейшего анализа он не
  нужен.
- Профиль в формате Chrome Trace (`*.trace.json`).
- Профили в формате stackcollapse (`*.txt`) аналогично команде fold.

## Документация агентов

- `CONTEXT.md` — словарь
- `docs/adr/` — решения
- `docs/agents/` — issue tracker / triage / domain layout
