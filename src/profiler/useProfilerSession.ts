import {useCallback, useRef, useState} from "react";
import type {IProfilerConfig} from "./profiler";
import {Profiler} from "./profiler";
import {uploadProfilePayload} from "./upload";

export type TProfilerSessionStatus =
    | {status: "idle"; error: null; fileName: null}
    | {status: "recording"; error: null; fileName: null}
    | {status: "stopping"; error: null; fileName: null}
    | {status: "uploading"; error: null; fileName: null}
    | {status: "done"; error: null; fileName: string}
    | {status: "error"; error: string; fileName: null};

const initialStatus: TProfilerSessionStatus = {status: "idle", error: null, fileName: null};

export const DEFAULT_AUTO_STOP_AFTER_MS = 10000;

export interface IUseProfilerSessionOptions {
    scenario: string;
    config?: IProfilerConfig;
    /** Stop and upload after this many milliseconds. Defaults to `DEFAULT_AUTO_STOP_AFTER_MS`. */
    autoStopAfterMs?: number;
}

export function useProfilerSession({
    scenario,
    config,
    autoStopAfterMs = DEFAULT_AUTO_STOP_AFTER_MS,
}: IUseProfilerSessionOptions) {
    const [status, setStatus] = useState<TProfilerSessionStatus>(initialStatus);
    const profilerRef = useRef<Profiler | null>(null);
    const stoppingRef = useRef(false);
    const timerRef = useRef<number | null>(null);

    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            window.clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const stop = useCallback(async () => {
        if (stoppingRef.current || !profilerRef.current) {
            return;
        }
        stoppingRef.current = true;
        clearTimer();
        setStatus({status: "stopping", error: null, fileName: null});

        try {
            const profiler = profilerRef.current;
            profilerRef.current = null;
            await profiler.stop();
            setStatus({status: "idle", error: null, fileName: null});
        } catch (err) {
            console.error(err);
            setStatus({
                status: "error",
                error: err instanceof Error ? err.message : String(err),
                fileName: null,
            });
        } finally {
            stoppingRef.current = false;
        }
    }, [clearTimer]);

    const stopAndUpload = useCallback(async () => {
        if (stoppingRef.current || !profilerRef.current) {
            return;
        }
        stoppingRef.current = true;
        clearTimer();
        setStatus({status: "stopping", error: null, fileName: null});

        try {
            const profiler = profilerRef.current;
            profilerRef.current = null;
            const payload = await profiler.stop();
            if (!payload) {
                setStatus({
                    status: "error",
                    error: "Профиль пуст или Self-profiling недоступен (нет событий / нет API).",
                    fileName: null,
                });
                return;
            }

            setStatus({status: "uploading", error: null, fileName: null});
            const {fileName} = await uploadProfilePayload(scenario, payload);
            setStatus({status: "done", error: null, fileName});
        } catch (err) {
            console.error(err);
            setStatus({
                status: "error",
                error: err instanceof Error ? err.message : String(err),
                fileName: null,
            });
        } finally {
            stoppingRef.current = false;
        }
    }, [clearTimer, scenario]);

    const start = useCallback(() => {
        if (profilerRef.current) {
            return false;
        }

        stoppingRef.current = false;
        const profiler = new Profiler(config);
        const started = profiler.start();
        if (!started) {
            setStatus({
                status: "error",
                error: "Self-profiling API недоступен или уже запущен. Нужен Chromium и заголовок Document-Policy: js-profiling.",
                fileName: null,
            });
            return false;
        }

        profilerRef.current = profiler;
        timerRef.current = window.setTimeout(stopAndUpload, autoStopAfterMs);
        setStatus({status: "recording", error: null, fileName: null});
        return true;
    }, [autoStopAfterMs, config, stopAndUpload]);

    return {status, start, stop, stopAndUpload};
}
