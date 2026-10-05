import {useEffect} from "react";
import {RecordingControls, ScenarioLayout} from "../components/ScenarioChrome";
import {SpeakerHint} from "../components/SpeakerHint";
import {HeavyScrollDemo} from "../demos/HeavyScrollDemo";
import {type IUseProfilerSessionOptions, useProfilerSession} from "../profiler/useProfilerSession";

const SCROLL_DURATION_MS = 10000;

const SCROLL_OPTIONS: IUseProfilerSessionOptions = {
    scenario: "scroll",
    config: {
        // Оставляем события для построения параллельного таймлайна "события + профиль"
        eventNames: ["scroll", "wheel", "touchmove"],
        stripSamplesWithoutEvents: false,
    },
    autoStopAfterMs: SCROLL_DURATION_MS,
};

export function ScrollPage() {
    const {status, start, stopAndUpload} = useProfilerSession(SCROLL_OPTIONS);

    useEffect(() => {
        start();

        return () => {
            void stopAndUpload();
        };
    }, [start, stopAndUpload]);

    return (
        <ScenarioLayout
            controls={<RecordingControls onStart={start} onStop={stopAndUpload} status={status} />}
            description={`Тяжёлый скролл / виртуальный список. Автостарт записи на mount; стоп через autoStopAfterMs (${SCROLL_DURATION_MS} мс) или вручную; автоматический аплоад профиля.`}
            hint={
                <SpeakerHint>
                    <ol>
                        <li>
                            Поскролль список, потом «Стоп» или дождись таймаута {SCROLL_OPTIONS.autoStopAfterMs} мс.
                        </li>
                        <li>
                            Начинать запись профиля можно при монтировании списка, при mouseenter (нужно отслеживать
                            многократные mouseenter-mouseleave), при начале скролла (возможен лаг скролла, пока
                            профайлер стартует).
                        </li>
                        <li>Заканчивать запись можно по тайм-ауту, при mouseleave, при размонтировании компонента.</li>
                        <li>На talk этот сценарий — короткий обзор; live-захват опционален.</li>
                    </ol>
                </SpeakerHint>
            }
            title="Scroll Scenario"
        >
            <HeavyScrollDemo />
        </ScenarioLayout>
    );
}
