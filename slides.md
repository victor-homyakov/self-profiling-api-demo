---
duration: 42min
theme: dracula
addons:
  - slidev-addon-qrcode
  - slidev-addon-second-screen
  - slidev-addon-timing-bar
  - slidev-addon-window-mockup
---

<!-- https://github.com/whitphx/slidev-addon-window-mockup#usage -->

# Self-Profiling API
## как узнать, почему у пользователя всё тормозит

---
section: true
---

# О себе

Это продолжение серии докладов о производительности и профилировании

- 2026 HolyJS "Как находить утечки памяти: практический воркшоп в Chrome DevTools"
- 2024 HolyJS "Ускорение приложений на Node: когда стандартного профайлера недостаточно"
- 2023 HolyJS "Написание бенчмарков и performance-тестов для кода на JS/TS"
- 2022 HolyJS "Планировщик задач: не замораживаем вкладку при открытии страницы"
- 2021 GDG Minsk "Память и её утечки в Chrome и Node.js. Нестандартные способы оптимизации памяти в Node.js."
- 2021 Habr "Приёмы ускорения кода на JS и других языках"
- 2021 Я.Субботник "Приёмы оптимизации кода по скорости"
- 2021 Я.Субботник "Код на React и TypeScript, который работает быстро"
- 2019 MinskJS "Профилирование JS: увидеть самое важное и не утонуть в море чисел"
- 2018 Я.Субботник "Производительность JS: чтобы улучшить, надо измерить"

---
section: true
---

# О профилировании

О профилировании вообще, о DevTools - что и как использовать
Firefox, Safari - что там есть. Почему Chrome DevTools (а также Chromium, Edge, Opera, Yandex).
Если в Chrome DevTools быстро - то в 99% и в Firefox/Safari будет быстро.

Сэмплирование и инструментирование

---

## Проблема фронтендера с макбуком и iPhone

Почему недостаточно попрофилировать на макбуке/iPhone фронтендера или в CI - часто не говорит о реальных проблемах в проде, INP, плагины etc.

Программист и тестировщик запускают в офисной сети на мощных MacBook и iPhone, постоянно заряжающихся от сети.

Реальные проблемы в проде:
- бюджетные устройства (пенсионеры на старых ноутбуках, школьники на дешёвых андроидах)
- неожиданные браузерные расширения
- режим экономии заряда батареи, многоядерные CPU но код выполняется на энергоэффективных ядрах
- всё медленно открывается, и не всегда причина в сети
- тормоза JS (INP)
- тормоза при скролле

---
section: true
---

# Что такое Self-Profiling API и как оно поможет

Описание

https://caniuse.com/wf-profiler
![CanIUse Profiler](/caniuse-profiler.png)

Просто погуглить не поможет — API есть с 2021 года, но в сети материалов очень мало, 99% просто краткие пересказы API, стоящих статей всего ДВЕ, примеров кода ещё меньше.

MDN содержит краткое описание API и формата данных, но ничего про сценарии использования и пост-обработку результатов.

Натравить ИИшку не поможет — ей просто не на чем было обучаться.

---

# Байки из прода

- Что я нашёл с его помощью TODO поднять архивы
- Примеры анализа
- Примеры оптимизаций флеймграфов до/после

---

Базовая идея: у кучи реальных пользователей запускаем и останавливаем когда НАМ надо

Решение:
- Когда нужно попрофилировать — в заголовках ответа html-страницы включаете `Document-Policy: js-profiling` (Profiler без этого заголовка не запустится).
  - "Когда нужно": по АБ-флагу, по рубильнику в админке и т.п.
  - Заголовок отдаёте как угодно: nginx, express на bff, etc.
- Запускаем/останавливаем профайлер по произвольным условиям.
- Фильтруем и вырезаем ненужное (это просто JSON)
- Отправляем на сервер — нужно место для аплоада. Дальше или сваливаем в виде файлов, или пишем в БД.

---

Обработка

- Как на сервере обработать собранные данные. Визуализация и интерпретация собранных профилей.
- Что дальше делать с полученными файлами - trace + Perfetto, stackcollapse + FlameGraph

Профиль в формате Chrome Trace (`*.trace.json`) можно открыть в https://ui.perfetto.dev/

Профили в формате stackcollapse (`*.txt`) нужно скормить программе FlameGraph Брендана
Грегга https://github.com/brendangregg/FlameGraph.
Она сгенерирует SVG с флеймграфами, которые можно открыть в браузере и проанализировать. Пример:

TODO показать анализ трейсов

---
section: true
---

# INP

Задача - улучшить INP. Подзадача - понять, что именно тормозит.

- исследование INP (автозапуск профайлера, мониторинг событий ввода, user interactions with heavy INP, stop, после
  остановки профайлера вырезание фрагмента трейса только с событиями, download and process profile, visualize)

- Демо 1 - INP - полный цикл: запись профиля, аплоад, обработка, визуализация

---

# Load

Короткое демо - запись, визуализация

- профилирование открытия страницы (автозапуск профайлера, остановка по событию DCL или load)

Примеры тормоза для демо: https://github.com/victorhuangwq/js-profiler-markers-demo/blob/main/test.html

---

# Scroll

Короткое демо - запись, визуализация

- исследование плавности скролла (component with heavy virtual scroll, start, scroll, stop, download and process
  profile, visualize)

---

# Прогулка по коду: включение/выключение, фильтрация, отправка, обработка

src/profiler/profiler.ts

- Чтобы запустить на странице Profiler, в HTTP-ответе должен быть включен заголовок `Document-Policy: js-profiling`

Неочевидные вещи:

- Опция `sampleInterval` имеет минимальное значение 10 или 16 мс в зависимости от железа, но можно всегда задавать 1 -
  тогда профайлер автоматически использует минимальное значение, потом его можно прочитать в `profiler.sampleInterval`
- При обработке трейса важно обращать внимание на timestamp в полученных `IProfilerSample` - сэмплы могут идти
  неравномерно, в том числе и чаще заданного `sampleInterval`.

Формат данных: src/profiler/types.ts

---
section: true
---

# Ссылки

- https://wicg.github.io/js-self-profiling/
- https://developer.mozilla.org/en-US/docs/Web/API/JS_Self-Profiling_API
- https://calendar.perfplanet.com/2021/js-self-profiling-api-in-practice/
- https://youtu.be/Di5wA0aGe80 + https://habr.com/ru/companies/avito/articles/759072/
- https://palette.dev/blog/chrome-devtools-not-enough

<QRCode
    :width="300"
    :height="300"
    type="svg"
    data="https://github.com/victor-homyakov/self-profiling-api-demo"
    :margin="10"
    :imageOptions="{ margin: 10 }"
    :backgroundOptions="{ color: '#fff' }"
    :dotsOptions="{ color: 'black' }"
/>

<!-- https://github.com/kozakdenys/qr-code-styling/tree/master?tab=readme-ov-file#qrcodestyling-instance -->

---
section: true
---

# Q&A
