---
duration: 42min
theme: dracula
addons:
  - slidev-addon-qrcode
  - slidev-addon-second-screen
  - slidev-addon-timing-bar
  - slidev-addon-window-mockup
---

# Self-Profiling API
## как узнать, почему у пользователя всё тормозит

<!--

Подготовка:
- запустить slidev и открыть слайды
- запустить и открыть демо
- открыть пример полного svg-профиля
- открыть пример трейса case-1-open в https://ui.perfetto.dev/

-->

---
section: true
---

# О себе

- Яндекс Поиск
- Яндекс Игры

<!--

Рассказать, что делаю.
Участвовал и участвую в проектах, в которых важна скорость работы у пользователя.
Профилирование и поиск утечек памяти в браузере и в Node.js.

-->

---

# О себе

Это продолжение серии докладов о производительности и профилировании

- 2018 Я.Субботник "Производительность JS: чтобы улучшить, надо измерить"
- 2019 MinskJS "Профилирование JS: увидеть самое важное и не утонуть в море чисел"
- 2021 Я.Субботник "Код на React и TypeScript, который работает быстро"
- 2021 Я.Субботник "Приёмы оптимизации кода по скорости"
- 2021 Habr "Приёмы ускорения кода на JS и других языках"
- 2021 GDG Minsk "Память и её утечки в Chrome и Node.js. Нестандартные способы оптимизации памяти в Node.js."
- 2022 HolyJS "Планировщик задач: не замораживаем вкладку при открытии страницы"
- 2023 HolyJS "Написание бенчмарков и performance-тестов для кода на JS/TS"
- 2024 HolyJS "Ускорение приложений на Node: когда стандартного профайлера недостаточно"
- 2026 HolyJS "Как находить утечки памяти: практический воркшоп в Chrome DevTools"

---
section: true
---

# О профилировании

О профилировании вообще,

Сэмплирование и инструментирование

---

# О профилировании

 о DevTools - что и как использовать
Firefox, Safari - что там есть. Почему Chrome DevTools (а также Chromium, Edge, Opera, Yandex).
Если в Chrome DevTools быстро - то в 99% и в Firefox/Safari будет быстро.

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

Доступно с 2021 года

https://caniuse.com/wf-profiler
![CanIUse Profiler](/caniuse-profiler.png)

---

# Что такое Self-Profiling API и как оно поможет

```js
const profiler = new Profiler({ maxBufferSize, sampleInterval });
// ...
const profile = await profiler.stop();
```

<v-clicks>

- MDN содержит описание API и формата данных, но ничего про сценарии использования и пост-обработку результатов
- 99% статей в сети - краткий пересказ MDN
- Хороших статей с полезными примерами всего ДВЕ
- Готового софта и библиотек, работающих с этим форматом, нет
- ИИ не поможет: ей просто не на чем было обучаться

</v-clicks>

<!--

Базовая идея: у кучи реальных пользователей запускаем и останавливаем когда НАМ надо

-->

---

# Байки из прода

- Что я нашёл с помощью Self-Profiling API
- Примеры анализа
- Сравнение флеймграфов до/после

TODO показать анализ трейсов live на вкладке браузера

---

## Case 1: window.open при клике по ссылке

![Profile](/case-1-open/profile-folded.svg)

---

## Case 2: хук логирования показа карточки

- каждая карточка использует хук `useOnShow`
- при загрузке каталога ВСЕ карточки на первом экране триггерят колбэк в `useOnShow`
- в колбэке логируется событие показа карточки
- внутри фильтрация параметров `filterUndefParamsInPlace`
- решение: ускорить логирование, сделать асинхронным

![Profile](/case-2-hook/profile.png)

<!--

В реальном проде много самых разных параметров, в отличие от тестового окружения.
Много карточек -> много логов -> долгая фильтрация.

-->

---

## Case 3: хук получения типа страницы

- хук `useIsErrorPage` используется при рендере каждой ссылки
- ссылок в каталоге очень много
- в хуке два `useSelector` + вложенный хук `useCurrentTab`
- решение: перенести в R/O контекст, считать один раз на странице

![Profile](/case-3-hook/profile.png)

---

## Сравнение: исходный профиль

<div class="h-100 overflow-y-auto">
  <img src="/case-4-comparison/desktop-1.svg" alt="Profile" class="w-full" />
</div>

---

## Сравнение: первая часть оптимизаций

<div class="h-100 overflow-y-auto">
  <img src="/case-4-comparison/desktop-2.svg" alt="Profile" class="w-full" />
</div>

---

## Сравнение: вторая часть оптимизаций + React 19

<div class="h-100 overflow-y-auto">
  <img src="/case-4-comparison/desktop-3.svg" alt="Profile" class="w-full" />
</div>

---

## Как реализовать сбор данных

- Когда включаем: по АБ-флагу, по рубильнику в админке и т.п.
- В заголовках ответа html-страницы `Document-Policy: js-profiling` (Profiler без него не запустится)
- Заголовок отдаём через nginx, BFF на express, etc.
- Запускаем профайлер по АБ-флагу, по действию пользователя и т.п.
- Останавливаем профайлер по таймеру, по действию пользователя, по событию window load и т.п.
- Вырезаем ненужное (это просто JSON), жмём gzip — получается всего десяток килобайт
- Отправляем на сервер наравне с аналитикой и RUM
- На сервере пишем в файлы или в БД

---

## Как реализовать обработку данных

<v-clicks>

- Отбираем самый интересный профиль
- <span v-mark.strike-through.red="3">Конвертируем в формат Chrome Profile и открываем в DevTools</span>
- Пришлось отказаться, ни я ни ИИ не смогли написать конвертер
- Конвертируем в более простой формат Chrome Trace `*.trace.json` и открываем в https://ui.perfetto.dev/

</v-clicks>

<!-- 

Переключиться на Perfetto и показать пример трейса

-->

---

## Как реализовать обработку данных

Профилей собирается много. Гораздо интереснее их агрегировать.

<v-clicks>

- Сливаем все собранные профили в один
- Сортируем стектрейсы по алфавиту
- Объединяем одинаковые стектрейсы в один, длительности суммируем

</v-clicks>

---

## Как реализовать обработку данных

Сортировка и объединение стектрейсов

<div class="stacks">
  <div v-click class="label">Профиль<br>пользователя 1</div>
  <div v-after class="row">
    <div class="item"><div class="stack" style="--ms: 5"><span class="fn-a">a</span></div><b>5 ms</b></div>
    <div class="item"><div class="stack" style="--ms: 5"><span class="fn-a">a</span><span class="fn-b">b</span><span class="fn-c">c</span></div><b>5 ms</b></div>
  </div>
  <div v-click class="label">Профиль<br>пользователя 2</div>
  <div v-after class="row">
    <div class="item"><div class="stack" style="--ms: 5"><span class="fn-b">b</span></div><b>5 ms</b></div>
    <div class="item"><div class="stack" style="--ms: 10"><span class="fn-a">a</span><span class="fn-b">b</span><span class="fn-c">c</span></div><b>10 ms</b></div>
  </div>
  <div v-click class="label total">Агрегированный<br>профиль</div>
  <div v-after class="row">
    <div class="item"><div class="stack" style="--ms: 5"><span class="fn-a">a</span></div><b>5 ms</b></div>
    <div class="item"><div class="stack" style="--ms: 5"><span class="fn-b">b</span></div><b>5 ms</b></div>
    <div class="item"><div class="stack" style="--ms: 15"><span class="fn-a">a</span><span class="fn-b">b</span><span class="fn-c">c</span></div><b>15 ms</b></div>
  </div>
</div>

<style>
.stacks {
  display: grid;
  grid-template-columns: max-content 1fr;
  align-items: end;
  gap: 1.2rem 2rem;
  margin-top: 1.5rem;
}

.stacks .label {
  font-size: 0.8rem;
  line-height: 1.2;
  opacity: 0.6;
  padding-bottom: 1.6rem;
}

.stacks .row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 1rem 1.5rem;
}

.stacks .label.total {
  opacity: 1;
  font-weight: 600;
}

.stacks .item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stacks .item b {
  margin-top: 0.4rem;
  font-size: 0.8rem;
  font-weight: 400;
  opacity: 0.7;
}

.stack {
  display: flex;
  flex-direction: column-reverse;
  gap: 2px;
  width: calc(var(--ms) * 1.1rem);
  font-family: var(--slidev-code-font-family, monospace);
}

.stack span {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 1.5rem;
  border-radius: 4px;
  color: #282a36;
  font-weight: 700;
}

.fn-a {
  background: #ff79c6;
}

.fn-b {
  background: #8be9fd;
}

.fn-c {
  background: #50fa7b;
}
</style>

---

## Как реализовать обработку данных

<v-clicks>

- Агрегированный профиль конвертируем в формат stackcollapse
- Отдаём программе FlameGraph Брендана Грегга https://github.com/brendangregg/FlameGraph
- Она генерирует интерактивный SVG с флеймграфом, который открываем в браузере и анализируем

</v-clicks>

<!-- 

Переключиться на SVG и показать пример флеймграфа

-->

---
section: true
---

# INP

Что такое INP

https://web.dev/articles/inp

Interaction:

- Clicking with a mouse
- Tapping on a device with a touchscreen
- Pressing a key on either a physical or onscreen keyboard

---

# INP

![](/inp-desktop-v2.svg)

Значение

- ≤ 200 мс — хорошая отзывчивость
- 200..500 мс — требуется улучшение
- \> 500 мс — плохая отзывчивость

---

# INP

TODO Скрин из DevTools Performance

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

# Прогулка по коду

Весь код доступен на GitHub, ссылка в конце доклада.

src/profiler/profiler.ts

- Я добавил логирование событий клавиатуры, мышки, тача. По аналогии можно добавлять и другие события.
- Профиль сжимается, gzip поддерживается в браузерном CompressionStream.
- URL ресурсов могут быть очень длинными из-за параметров. Я отрезаю все параметры.
- Для сокращения объёма данных можно отрезать сэмплы до первого и после последнего события.

Формат данных: src/profiler/types.ts

---

# Неочевидные вещи

- Чтобы запустить на странице Profiler, в HTTP-ответе должен быть включен заголовок<br>`Document-Policy: js-profiling`.
- Опция `sampleInterval` имеет минимальное значение 10 или 16 мс в зависимости от железа. Можно всегда задавать 1,
  тогда профайлер использует минимальное значение, потом его можно прочитать в `profiler.sampleInterval`.
- Важно обращать внимание на `timestamp` в полученных `IProfilerSample` - сэмплы могут идти неравномерно, в том числе
  и чаще заданного `sampleInterval`.


---
section: true
---

# Ссылки

- https://wicg.github.io/js-self-profiling/
- https://developer.mozilla.org/en-US/docs/Web/API/JS_Self-Profiling_API
- https://calendar.perfplanet.com/2021/js-self-profiling-api-in-practice/
- https://youtu.be/Di5wA0aGe80 + https://habr.com/ru/companies/avito/articles/759072/
- https://palette.dev/blog/chrome-devtools-not-enough

---

# Ссылки

Демо-приложение и код обработки профилей на GitHub:

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

<!--

Это практически все ссылки. как и говорил, материалов в интернете по этой теме крайне мало.

https://github.com/kozakdenys/qr-code-styling/tree/master?tab=readme-ov-file#qrcodestyling-instance

-->

---
section: true
---

# Спасибо за внимание! Вопросы?

&nbsp;

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
