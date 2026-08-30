import {useState, useEffect} from "react";
import {RecordingControls, ScenarioLayout} from "../components/ScenarioChrome";
import {SpeakerHint} from "../components/SpeakerHint";
import {HeavyModeToggle, LightOrHeavyRenderScenario} from "../demos/LightHeavyRenderDemo";
import {
    type IUseProfilerSessionOptions,
    useProfilerSession,
    DEFAULT_AUTO_STOP_AFTER_MS,
} from "../profiler/useProfilerSession";

const INP_OPTIONS: IUseProfilerSessionOptions = {
    scenario: "inp",
    config: {
        eventNames: ["mousedown", "touchstart", "pointerdown", "click"],
        stripSamplesWithoutEvents: true,
    },
};

export function InpPage() {
    const [isHeavy, setIsHeavy] = useState(true);
    const {status, start, stopAndUpload} = useProfilerSession(INP_OPTIONS);

    useEffect(() => {
        start();
        return () => {
            // Если при уходе с компонента INP нас больше не интересует - можем остановить профайлер
            // void stop();
            // Останавливаем профилирование и отправляем собранный профиль
            void stopAndUpload();
        };
    }, [start, stopAndUpload]);

    return (
        <ScenarioLayout
            controls={
                <>
                    <HeavyModeToggle isHeavy={isHeavy} onChange={setIsHeavy} />
                    <RecordingControls onStart={start} onStop={stopAndUpload} status={status} />
                </>
            }
            description="Тяжёлое взаимодействие, обрезка сэмплов вокруг input-событий, авто-upload Profile payload."
            hint={
                <SpeakerHint>
                    <ol>
                        <li>
                            Включи «Тяжёлый рендер», нажми «Старт», покликай по списку, потом «Стоп» или дождись
                            таймаута {DEFAULT_AUTO_STOP_AFTER_MS} мс
                        </li>
                        <li>
                            Payload уходит на сервер в <code>profiles/</code>
                        </li>
                        <li>
                            В терминале <code>npm run process-profile -- traces profiles</code>
                        </li>
                        <li>
                            В браузере открой <a href="https://ui.perfetto.dev/">https://ui.perfetto.dev/</a> и загрузи
                            туда полученный Chrome Trace json
                        </li>
                        <li>
                            В терминале <code>npm run process-profile -- fold profiles</code>
                        </li>
                        <li>Открой флеймграфы в демо</li>
                    </ol>
                </SpeakerHint>
            }
            title="INP Scenario"
        >
            <LightOrHeavyRenderScenario isHeavy={isHeavy} />
        </ScenarioLayout>
    );
}
