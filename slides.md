---
duration: 42min
theme: dracula
addons:
  - slidev-addon-qrcode
  - slidev-addon-second-screen
  - slidev-addon-timing-bar
---

# Self-Profiling API
## как узнать, почему у пользователя всё тормозит

<br /><br /><br />

## Виктор Хомяков

<!--

Подготовка:
- запустить slidev и открыть слайды
- запустить и открыть демо
- открыть полный svg-профиль
- открыть пример трейса case-1-open в https://ui.perfetto.dev/

-->

---
section:
  duration: 30s
---

## О себе

<div class="mt-6 flex flex-col gap-5 text-3xl">
  <div class="flex items-center gap-4">
    <img src="/targetprocess.png" alt="" class="h-16 w-16 rounded-full" />
    Targetprocess
  </div>
  <div class="flex items-center gap-4">
    <img src="/yandex-search.png" alt="" class="h-16 w-16" />
    Яндекс Поиск
  </div>
  <div class="flex items-center gap-4">
    <img src="/yandex-games.png" alt="" class="h-16 w-16 rounded-2xl" />
    Яндекс Игры
  </div>
</div>

<!--

Рассказать, что делаю.
Участвовал и участвую в проектах, в которых важна скорость работы у пользователя.
Профилирование и поиск утечек памяти в браузере и в Node.js.

-->

---

## О себе

Это продолжение серии докладов о производительности и профилировании

<div class="talks-scroll">

- 2018 Я.Субботник "Производительность JS: чтобы улучшить, надо измерить"
- 2019 MinskJS "Профилирование JS: увидеть самое важное и не утонуть в море чисел"
- 2021 Я.Субботник "Код на React и TypeScript, который работает быстро"
- 2021 Я.Субботник "Приёмы оптимизации кода по скорости"
- 2021 Habr "Приёмы ускорения кода на JS и других языках"
- 2021 GDG Minsk "Память и её утечки в Chrome и Node.js. Нестандартные способы оптимизации памяти в Node.js."
- 2022 HolyJS "Планировщик задач: не замораживаем вкладку при открытии страницы"
- 2023 HolyJS "Написание бенчмарков и performance-тестов для кода на JS/TS"
- 2024 HolyJS "Ускорение приложений на Node: когда стандартного профайлера недостаточно"
- 2026 HolyJS "Как находить утечки памяти: практический воркшоп в Chrome DevTools"

</div>

<style>
.talks-scroll {
  height: 368px;
  margin-top: 0.35rem;
  overflow: hidden;
  --fade: 1.35rem;
  -webkit-mask-image: linear-gradient(to bottom, transparent, #000 var(--fade), #000 calc(100% - var(--fade)), transparent);
  mask-image: linear-gradient(to bottom, transparent, #000 var(--fade), #000 calc(100% - var(--fade)), transparent);
}

.talks-scroll ul {
  margin: 0;
  padding-block: var(--fade);
  animation: talks-yoyo 22s ease-in-out infinite;
}

@keyframes talks-yoyo {
  0%,
  8% {
    transform: translateY(0);
  }

  50%,
  58% {
    transform: translateY(-237px);
  }

  100% {
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .talks-scroll ul {
    animation: none;
  }
}
</style>

---
section:
  duration: 2m
---

## Профилирование и профайлер

Профилирование — измерение и анализ производительности кода, чтобы найти узкие места

Два принципиально разных варианта профайлера:
- инструментирующий
- сэмплирующий

---

## Инструментирующий профайлер

<div class="flex items-center gap-3 mt-3">
  <img src="/internet-explorer.svg" alt="" class="h-12 w-12" />
  <img v-click src="/istanbul.png" alt="Istanbul" class="h-12 w-12" />
</div>

<v-click>

Минусы:
- замедляет старт кода (нужно всё инструментировать)
- замедляет выполнение мелких функций
- реализация или медленная или сложная<br />(ленивое инструментирование, динамическое деинструментирование горячего кода)

</v-click>

<v-click>

Плюсы:
- точное число вызовов, сложность алгоритма
- замеры работы с DOM (`getBoundingClientRect` etc.)

</v-click>

<!--

Известная аналогия: инструменты для code coverage типа Istanbul

-->

---

## Сэмплирующий профайлер

Все остальные браузеры и среды выполнения JS

<v-click>

Плюсы:
- не замедляет старт кода
- слабо замедляет выполнение кода
- слабо искажает замеры

</v-click>

<v-click>

Минусы:
- мелкая редкая функция может не попасть в сэмплы
- периодическая функция может интерферировать с сэмплами (пропасть или усилиться)
- нет числа вызовов (не понимаем сложность алгоритма)

</v-click>

---

## Что использую

- Субъективно в Firefox и Safari — неудобный профайлер
- Объективно Chrome DevTools функциональнее: есть Performance, Memory, Lighthouse, Trace
- Chrome (Chromium, Edge, Yandex Browser)
- Если в Chrome быстро — в 99% и в Firefox/Safari будет быстро

---
section:
  duration: 2m
---

## Проблема воспроизведения performance-багов

- Пользователи: жалуются на тормоза
- Google Search Console говорит: есть тормоза
- "У меня всё работает" (c)

<!--

Почему недостаточно попрофилировать на макбуке/iPhone фронтендера или в CI - часто не говорит о реальных проблемах в проде, INP, плагины etc.

-->

---

## Проблема воспроизведения performance-багов

<img src="/users/macbook-frontender-1.jpg" alt="" class="mx-auto mt-2 max-h-[22rem] max-w-full object-contain" />

<p class="text-center">Быстрая и стабильная офисная сеть</p>

<!--

Программист и тестировщик запускают в быстрой офисной сети на мощных MacBook и iPhone, постоянно заряжающихся от розетки.

-->

---

## Проблема воспроизведения performance-багов

<img src="/users/macbook-frontender-2.jpg" alt="" class="mx-auto mt-2 max-h-[22rem] max-w-full object-contain" />

<p class="text-center">Мощные MacBook и iPhone</p>

---

## Проблема воспроизведения performance-багов

<img src="/users/macbook-frontender-3.jpg" alt="" class="mx-auto mt-2 max-h-[22rem] max-w-full object-contain" />

<p class="text-center">Постоянно заряжаются от розетки</p>

---

## Проблема воспроизведения performance-багов

<img src="/users/budget-user-1.webp" alt="" class="mx-auto mt-2 max-h-[22rem] max-w-full object-contain" />

<p class="text-center">Бюджетные ноутбуки</p>

---

## Проблема воспроизведения performance-багов

<img src="/users/budget-user-2.jpg" alt="" class="mx-auto mt-2 max-h-[22rem] max-w-full object-contain" />

<p class="text-center">Дешёвые телефоны</p>

---

## Проблема воспроизведения performance-багов

<img src="/users/budget-user-3.jpeg" alt="" class="mx-auto mt-2 max-h-[22rem] max-w-full object-contain" />

<p class="text-center">Режим экономии батареи</p>

---

## Проблема воспроизведения performance-багов

<img src="/users/budget-user-4.jpg" alt="" class="mx-auto mt-2 max-h-[22rem] max-w-full object-contain" />

<p class="text-center">Плохая сеть</p>

---

## Проблема воспроизведения performance-багов

<img src="/users/budget-user-5.jpg" alt="" class="mx-auto mt-2 max-h-[22rem] max-w-full object-contain" />

<p class="text-center">Много пользователей и сценариев работы</p>

<!--

Из неожиданного: WB/Ozon - намного удобнее добавлять товары в корзину, чем использовать "Избранное", закладки и т.п.

-->

---

## Проблема воспроизведения performance-багов

Реальный мир:
- бюджетные устройства (пенсионеры на старых ноутбуках, школьники на дешёвых андроидах)
- неожиданные браузерные расширения
- режим экономии заряда батареи
- многоядерные CPU, но код выполняется на энергоэффективных ядрах

---

## Проблема воспроизведения performance-багов

- сайт медленно открывается, и не всегда причина в сети
- тормозит JS (INP)
- тормозит скролл

<!--

Самые частые проблемы frontend-performance можно объединить в три категории

-->

---
section:
  duration: 15m
---

## Что такое Self-Profiling API и как оно поможет

Доступно в Chromium с 2021 года

https://caniuse.com/wf-profiler
![CanIUse Profiler](/caniuse-profiler.png)

---

## Что такое Self-Profiling API и как оно поможет

```js
const profiler = new Profiler({ maxBufferSize, sampleInterval });
// ...
const profile = await profiler.stop();
```

<v-clicks>

- MDN содержит описание API и формата данных,<br />
  ничего про сценарии использования и обработку результатов
- 99% статей в сети — краткий пересказ MDN
- Хороших статей с полезными примерами всего ДВЕ, и вторая опирается на первую
- Нет софта, работающего с этим форматом
- ИИ не поможет: не на чем было обучаться

</v-clicks>

---

## Как реализовать сбор данных

<v-clicks>

- Базовая идея: включаем у кучи реальных пользователей и получаем кучу профилей
- Когда включаем: feature-флаг, рубильник в админке
- При наличии флага на клиенте запускаем профайлер ASAP или по действию пользователя или по другому признаку
- Останавливаем профайлер по таймеру, по действию пользователя, по событию window load и т.п.
- Получаем хорошо нормализованный JSON, вырезаем ненужное, жмём gzip — архив занимает пару десятков килобайт
- Отправляем на сервер наравне с аналитикой и RUM
- На сервере пишем в файлы или в БД

</v-clicks>

---

## Как реализовать обработку данных

<v-clicks>

- Отбираем самый интересный профиль
- <span v-mark.strike-through.red="3">Конвертируем в формат Chrome Profile и открываем в DevTools</span>
- Пришлось отказаться, ни я ни ИИ не смогли написать конвертер
- Конвертируем в более простой формат Chrome Trace `*.trace.json`
- (Демо) Открываем в https://ui.perfetto.dev/

</v-clicks>

<!-- 

Переключиться на Perfetto и показать пример трейса

-->

---

## Как реализовать обработку данных

Профилей много, интересно их агрегировать

<v-clicks>

- Сортируем стектрейсы по алфавиту
- Сливаем одинаковые стектрейсы в один, длительности суммируем

</v-clicks>

---

## Как реализовать обработку данных

<div class="stacks">
  <div v-click class="label">Профиль<br>пользователя 1</div>
  <div v-after class="row">
    <div class="item"><div class="stack" style="--ms: 10"><span class="fn-a">a</span></div><b>10 ms</b></div>
    <div class="item"><div class="stack" style="--ms: 10"><span class="fn-a">a</span><span class="fn-b">b</span><span class="fn-c">c</span></div><b>10 ms</b></div>
  </div>
  <div v-click class="label">Профиль<br>пользователя 2</div>
  <div v-after class="row">
    <div class="item"><div class="stack" style="--ms: 10"><span class="fn-a">a</span><span class="fn-b">b</span></div><b>10 ms</b></div>
    <div class="item"><div class="stack" style="--ms: 10"><span class="fn-a">a</span><span class="fn-b">b</span><span class="fn-c">c</span></div><b>10 ms</b></div>
  </div>
  <div v-click class="label total">Агрегированный<br>профиль</div>
  <div v-after class="row">
    <div class="item"><div class="stack" style="--ms: 10"><span class="fn-a">a</span></div><b>10 ms</b></div>
    <div class="item"><div class="stack" style="--ms: 10"><span class="fn-a">a</span><span class="fn-b">b</span></div><b>10 ms</b></div>
    <div class="item"><div class="stack" style="--ms: 20"><span class="fn-a">a</span><span class="fn-b">b</span><span class="fn-c">c</span></div><b>20 ms</b></div>
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
  opacity: 0.8;
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
  opacity: 0.8;
}

.stack {
  display: flex;
  flex-direction: column-reverse;
  gap: 2px;
  width: calc(var(--ms) * 0.5rem);
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
- Она генерирует интерактивный SVG с флеймграфом
- (Демо) Открываем SVG в браузере и анализируем

</v-clicks>

<!-- 

Переключиться на SVG и показать пример флеймграфа

-->

---
section:
  duration: 19m
---

## INP (Interaction to Next Paint)

https://web.dev/articles/inp

За Interaction считается только:
- Клик мышкой
- Тап на тачскрине
- Нажатие на физической или экранной клавиатуре

---

## INP

![](/inp-desktop-v2.svg)

Значение

- ≤ 200 мс — хорошая отзывчивость
- 200..500 мс — требуется улучшение
- \> 500 мс — плохая отзывчивость

---

<img src="/chrome-devtools-inp-example.png" alt="" class="mx-auto -max-h-[30rem] max-h-full max-w-full object-contain" />

<!-- ![](/chrome-devtools-inp-example.png) -->

---

## Демо 1: INP

Задача: улучшить INP. Подзадача: понять, что именно тормозит.

- запускаем профайлер
- мониторим события ввода
- после остановки — вырезание фрагмента трейса только с событиями
- полное демо: запись профиля, аплоад, обработка, визуализация

---

## Что нашёл в проде: `window.open` при клике по ссылке

![Profile](/case-1-open/profile-folded.svg)

---

## Демо 2: Load

Задача: ускорить открытие страницы

- профайлер размещаем в inline-скрипте в head и запускаем ASAP
- остановка по событию DCL или load или TTI
- аналогично для soft-навигации в SPA
- короткое демо

---

## Что нашёл в проде: хук логирования показа карточки

<v-clicks>

- хотим логировать показ карточек
- добавили хук `useOnShow` в каждую карточку
- при загрузке каталога ВСЕ карточки на первом экране триггерят колбэк в `useOnShow`
- в колбэке долго строим параметры для лога `filterUndefParamsInPlace`<br />
  т.к. в реальном проде очень много самых разных параметров
- решение: ускорить логирование, сделать асинхронным

</v-clicks>

![Profile](/case-2-hook/profile.png)

<!--

В реальном проде много самых разных параметров, в отличие от тестового окружения.
Много карточек -> много логов -> долгая фильтрация.

-->

---

## Что нашёл в проде: хук получения типа страницы

<v-clicks>

- хотим отслеживать, что пришёл пользователь со страницы 404
- добавили хук `useIsErrorPage` в рендер каждой ссылки
- ссылок в каталоге очень много
- в хуке два `useSelector` + вложенный хук `useCurrentTab`
- решение: перенести в R/O контекст, считать один раз на странице

</v-clicks>

![Profile](/case-3-hook/profile.png)

<!--

В каталоге товаров, если пользователь искал, например, валенки, и не нашёл - показываем 404.
Но при этом здесь же показываем хоть немного похожие товары: угги, зимние сапоги и т.п.
Аналитики хотят, чтобы переход на товар со страницы 404 можно было отличить, поэтому в ссылку добавляем параметры.

-->

---

## Демо 3: Scroll

Задача: сделать скролл плавным

- профайлер стартует перед монтированием компонента с тяжёлым скроллом
- в профиле можно отрезать всё до и всё после скролла
- короткое демо

---
section:
  duration: 3m
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

<!-- ## Прогулка по коду

Весь код доступен на GitHub, ссылка в конце доклада.

src/profiler/profiler.ts

- Я добавил логирование событий клавиатуры, мышки, тача. По аналогии можно добавлять и другие события.
- Профиль сжимается, gzip поддерживается в браузерном CompressionStream.
- URL ресурсов могут быть очень длинными из-за параметров. Я отрезаю все параметры.
- Для сокращения объёма данных можно отрезать сэмплы до первого и после последнего события.

Формат данных: src/profiler/types.ts -->

## Неочевидные вещи

<v-clicks>

- Чтобы запустить на странице Profiler, в HTTP-ответе должен быть заголовок `Document-Policy: js-profiling`. Заголовок отдаём через nginx или express.
- В некоторых странах требуется разрешение пользователя на сбор performance-related информации (GDPR, user consent).
- Опция `sampleInterval` имеет минимальное значение 10 или 16 мс в зависимости от железа. Можно задавать 1, тогда профайлер использует минимальное значение, потом его можно прочитать в `profiler.sampleInterval`.
- Важно обращать внимание на `timestamp` в полученных `IProfilerSample`. Сэмплы могут идти неравномерно, в том числе чаще заданного `sampleInterval`.

</v-clicks>

---
section:
  duration: 30s
---

## Ссылки

- https://wicg.github.io/js-self-profiling/
- https://developer.mozilla.org/en-US/docs/Web/API/JS_Self-Profiling_API
- https://calendar.perfplanet.com/2021/js-self-profiling-api-in-practice/
- https://youtu.be/Di5wA0aGe80 + https://habr.com/ru/companies/avito/articles/759072/
- https://palette.dev/blog/chrome-devtools-not-enough

<!--

Это практически все ссылки. как и говорил, материалов в интернете по этой теме крайне мало.

-->

---

## Ссылки

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

https://github.com/kozakdenys/qr-code-styling/tree/master?tab=readme-ov-file#qrcodestyling-instance

-->

---

## Спасибо за внимание! Вопросы?

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
