import {SpeakerHint} from "../components/SpeakerHint";
import {LightHeavyRenderDemo} from "../demos/LightHeavyRenderDemo";

export function ProfilerPage() {
    return (
        <div>
            <h1>1. Self-profiling API</h1>
            <p>Лёгкий и тяжёлый рендер, сбор данных в продакшене.</p>

            <LightHeavyRenderDemo />

            <SpeakerHint>
                <ol>
                    <li>
                        Выбери «Лёгкий рендер» или «Тяжёлый рендер», нажимай кнопки в блоке — в тяжёлом режиме в профиле
                        виден долгий commit.
                    </li>
                    <li>
                        «Старт Self-profiling» / «Стоп и скачать» — запись профиля, экспорт в JSON и скачивание файла.
                        Если Self-profiling не работает, проверь в ответе сервера наличие заголовка{" "}
                        <code>Document-Policy: js-profiling</code>. Работает во всех сборках, но наиболее точные
                        результаты даст в production-сборке.
                    </li>
                </ol>
            </SpeakerHint>
        </div>
    );
}
