import {useEffect} from "react";
import {RecordingControls, ScenarioLayout} from "../components/ScenarioChrome";
import {SpeakerHint} from "../components/SpeakerHint";
import {type IUseProfilerSessionOptions, useProfilerSession} from "../profiler/useProfilerSession";

const SOFT_LOAD_DURATION_MS = 2500;

const SOFT_LOAD_OPTIONS: IUseProfilerSessionOptions = {
    scenario: "load-soft",
    config: {
        eventNames: [],
        stripSamplesWithoutEvents: false,
    },
    autoStopAfterMs: SOFT_LOAD_DURATION_MS,
};

const loadScenarioContent = (
    <p style={{color: "#64748b"}}>
        Контент «открытия страницы»: баннеры, списки, тяжёлый first paint можно нарастить позже. Сейчас важен lifecycle
        Profiler → auto-upload.
    </p>
);

export function SoftLoadPage() {
    const {status, start} = useProfilerSession(SOFT_LOAD_OPTIONS);

    useEffect(() => {
        start();
    }, [start]);

    return (
        <ScenarioLayout
            controls={<RecordingControls status={status} />}
            description="SPA-переход: Profiler стартует при монтировании, стоп по тайм-ауту soft load."
            hint={
                <SpeakerHint>
                    <ol>
                        <li>
                            При SPA-переходе на /load профилирование начинается при монтировании компонента и длится{" "}
                            {SOFT_LOAD_DURATION_MS} мс.
                        </li>
                        <li>Профиль автоматически загружается на сервер после остановки профилирования.</li>
                        <li>На talk этот Scenario — короткий обзор; live-захват опционален.</li>
                    </ol>
                </SpeakerHint>
            }
            title="Load Scenario"
        >
            {loadScenarioContent}
        </ScenarioLayout>
    );
}
