import {useEffect} from "react";
import {RecordingControls, ScenarioLayout} from "../components/ScenarioChrome";
import {SpeakerHint} from "../components/SpeakerHint";
import {type IUseProfilerSessionOptions, useProfilerSession} from "../profiler/useProfilerSession";
import {Profiler} from "../profiler/profiler";
import {uploadProfilePayload} from "../profiler/upload";

const SOFT_LOAD_DURATION_MS = 2500;
const LOAD_OPTIONS: IUseProfilerSessionOptions = {
    scenario: "load",
    config: {
        eventNames: [],
        stripSamplesWithoutEvents: false,
    },
    autoStopAfterMs: 15000,
};
const SOFT_LOAD_OPTIONS: IUseProfilerSessionOptions = {
    scenario: "load-soft",
    config: {
        eventNames: [],
        stripSamplesWithoutEvents: false,
    },
    autoStopAfterMs: SOFT_LOAD_DURATION_MS,
};

let profiler: Profiler | undefined;
let profilerStarted = false;
let profilerStopping = false;

/**
 * autoStart ... slow loading ... autoStopAfterMs ... load
 * autoStart ... load + stop()
 * autoStart ... softLoad + stop()
 */
if (typeof window !== "undefined" && location.pathname === "/load") {
    profiler = new Profiler(LOAD_OPTIONS.config);
    profilerStarted = profiler.start();
    if (profilerStarted) {
        console.log("Profiler started");
    } else {
        console.error("Profiler not started");
    }

    async function stopAndUpload() {
        if (profilerStopping) {
            return;
        }

        if (!profilerStarted || !profiler) {
            console.error("Profiler not started, cannot stop");
            return;
        }

        profilerStopping = true;
        try {
            const payload = await profiler.stop();
            if (payload) {
                const {fileName} = await uploadProfilePayload(LOAD_OPTIONS.scenario, payload);
                console.log(`Profile uploaded to ${fileName}`);
            }
        } catch (e) {
            console.error(e);
        } finally {
            profiler = undefined;
            profilerStarted = false;
            profilerStopping = false;
        }
    }

    if (document.readyState === "complete") {
        window.setTimeout(stopAndUpload, SOFT_LOAD_DURATION_MS);
    } else {
        window.addEventListener("load", stopAndUpload, {once: true});
        window.setTimeout(stopAndUpload, LOAD_OPTIONS.autoStopAfterMs);
    }
}

export function LoadPage() {
    const {status, start} = useProfilerSession(SOFT_LOAD_OPTIONS);

    useEffect(() => {
        if (!profilerStarted) {
            start();
            // Не останавливаем профилирование при размонтировании компонента, дожидаемся soft load
        }
    }, [start]);

    return (
        <ScenarioLayout
            controls={<RecordingControls status={status} />}
            description="Автостарт Profiler при входе на страницу; стоп на window load или на тайм-аут при soft-navigation."
            hint={
                <SpeakerHint>
                    <ol>
                        <li>
                            При жёсткой навигации на URL или обновлении вкладки браузера профилирование начинается
                            автоматически при выполнении скрипта с этим компонентом и заканчивается на window load.
                        </li>
                        <li>
                            При SPA-переходе профилирование начинается автоматически при монтировании этого компонента и
                            длится {SOFT_LOAD_DURATION_MS} мс.
                        </li>
                        <li>Профиль автоматически загружается на сервер после остановки профилирования.</li>
                        <li>На talk этот Scenario — короткий обзор; live-захват опционален.</li>
                    </ol>
                </SpeakerHint>
            }
            title="Load Scenario"
        >
            <p style={{color: "#64748b"}}>
                Контент «открытия страницы»: баннеры, списки, тяжёлый first paint можно нарастить позже. Сейчас важен
                lifecycle Profiler → auto-upload.
            </p>
        </ScenarioLayout>
    );
}
