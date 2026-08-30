import {useSyncExternalStore} from "react";
import {RecordingControls, ScenarioLayout} from "../components/ScenarioChrome";
import {SpeakerHint} from "../components/SpeakerHint";
import {Profiler} from "../profiler/profiler";
import type {TProfilerSessionStatus} from "../profiler/useProfilerSession";
import {uploadProfilePayload} from "../profiler/upload";

const HARD_LOAD_SCENARIO = "load";
const HARD_LOAD_AUTO_STOP_MS = 15000;
const HARD_LOAD_COMPLETE_FALLBACK_MS = 2500;

let hardLoadCaptureActive = false;
let hardLoadStatus: TProfilerSessionStatus = {status: "idle", error: null, fileName: null};
const hardLoadSubscribers = new Set<() => void>();

function publishHardLoadStatus(next: TProfilerSessionStatus): void {
    hardLoadStatus = next;
    hardLoadSubscribers.forEach((notify) => notify());
}

function subscribeHardLoadStatus(onStoreChange: () => void): () => void {
    hardLoadSubscribers.add(onStoreChange);
    return () => hardLoadSubscribers.delete(onStoreChange);
}

function getHardLoadStatusSnapshot(): TProfilerSessionStatus {
    return hardLoadStatus;
}

let profiler: Profiler | undefined;
let profilerStarted = false;
let profilerStopping = false;

if (typeof window !== "undefined" && location.pathname === "/load") {
    hardLoadCaptureActive = true;
    profiler = new Profiler({eventNames: [], stripSamplesWithoutEvents: false});
    profilerStarted = profiler.start();
    if (profilerStarted) {
        publishHardLoadStatus({status: "recording", error: null, fileName: null});
        console.log("Profiler started");
    } else {
        console.error("Profiler not started");
        publishHardLoadStatus({
            status: "error",
            error: "Self-profiling API недоступен или уже запущен.",
            fileName: null,
        });
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
        publishHardLoadStatus({status: "stopping", error: null, fileName: null});

        try {
            const payload = await profiler.stop();
            if (payload) {
                publishHardLoadStatus({status: "uploading", error: null, fileName: null});
                const {fileName} = await uploadProfilePayload(HARD_LOAD_SCENARIO, payload);
                console.log(`Profile uploaded to ${fileName}`);
                publishHardLoadStatus({status: "done", error: null, fileName});
            } else {
                publishHardLoadStatus({
                    status: "error",
                    error: "Профиль пуст или Self-profiling недоступен.",
                    fileName: null,
                });
            }
        } catch (error) {
            console.error(error);
            publishHardLoadStatus({
                status: "error",
                error: error instanceof Error ? error.message : String(error),
                fileName: null,
            });
        } finally {
            profiler = undefined;
            profilerStarted = false;
            profilerStopping = false;
            hardLoadCaptureActive = false;
        }
    }

    if (profilerStarted) {
        if (document.readyState === "complete") {
            window.setTimeout(stopAndUpload, HARD_LOAD_COMPLETE_FALLBACK_MS);
        } else {
            window.addEventListener("load", stopAndUpload, {once: true});
            window.setTimeout(stopAndUpload, HARD_LOAD_AUTO_STOP_MS);
        }
    }
}

export function isHardLoadCaptureActive(): boolean {
    return hardLoadCaptureActive;
}

const loadScenarioContent = (
    <p style={{color: "#64748b"}}>
        Контент «открытия страницы»: баннеры, списки, тяжёлый first paint можно нарастить позже. Сейчас важен lifecycle
        Profiler → auto-upload.
    </p>
);

export function HardLoadPage() {
    const status = useSyncExternalStore(subscribeHardLoadStatus, getHardLoadStatusSnapshot);

    return (
        <ScenarioLayout
            controls={<RecordingControls status={status} />}
            description="Жёсткая навигация: Profiler стартует до React, стоп на window load или тайм-аут."
            hint={
                <SpeakerHint>
                    <ol>
                        <li>
                            При жёсткой навигации на URL или обновлении вкладки профилирование начинается при выполнении
                            скрипта этой страницы и заканчивается на window load.
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
