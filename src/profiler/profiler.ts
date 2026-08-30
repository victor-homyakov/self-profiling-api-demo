import {compressObject} from "./codec";
import type {IProfilerInitOptions, IProfilerSample, IProfilerTrace, IWindowWithProfiler} from "./types";

export interface IProfilerConfig extends Partial<IProfilerInitOptions> {
    /** Запас времени в миллисекундах, чтобы собрать все сэмплы последнего события */
    durationAfterLastEvent?: number;
    eventNames?: string[];
    stripSamplesWithoutEvents?: boolean;
}

export interface IProfiledEvent {
    timestamp: number;
    type: string;
}

export interface IProfileData {
    events: IProfiledEvent[];
    /** Интервал сэмплирования в миллисекундах. Чаще всего равен 10 или 16 мс. */
    sampleInterval: number;
    trace: IProfilerTrace;
}

export class Profiler {
    private static readonly DEFAULT_CONFIG: Required<IProfilerConfig> = {
        durationAfterLastEvent: 300,
        // Представляющие интерес пользовательские события; после них скорее всего будет рендер
        eventNames: ["mousedown", "touchstart", "pointerdown", "click"],
        maxBufferSize: 1000,
        // Если браузер не поддерживает 1 мс, то будет использовать своё минимальное значение, чаще всего 10 или 16 мс
        sampleInterval: 1,
        stripSamplesWithoutEvents: true,
    };

    private config: Required<IProfilerConfig>;
    private isRunning = false;
    private nativeProfiler?: InstanceType<NonNullable<IWindowWithProfiler["Profiler"]>>;
    private events: IProfiledEvent[] = [];

    constructor(config: IProfilerConfig = {}) {
        this.config = {...Profiler.DEFAULT_CONFIG, ...config};
    }

    public start(): boolean {
        if (!this.isEnvironmentSupported() || this.isRunning) {
            return false;
        }

        const NativeProfiler = (window as IWindowWithProfiler).Profiler;
        if (!NativeProfiler) {
            return false;
        }

        try {
            this.nativeProfiler = new NativeProfiler({
                maxBufferSize: this.config.maxBufferSize,
                sampleInterval: this.config.sampleInterval,
            });

            this.addEventListeners();
            this.isRunning = true;
            console.log("Started with sampleInterval", this.nativeProfiler.sampleInterval);

            return true;
        } catch (error) {
            console.log("Failed to start", error);
            return false;
        }
    }

    public stop(): Promise<string | null> {
        if (!this.isRunning || !this.nativeProfiler) {
            return Promise.resolve(null);
        }

        const sampleInterval = this.nativeProfiler.sampleInterval;

        return this.nativeProfiler
            .stop()
            .then((trace) => this.processProfile(trace, sampleInterval, this.events))
            .catch((error) => {
                console.log("Failed to stop", error);
                return null;
            })
            .finally(() => {
                this.cleanup();
            });
    }

    private isEnvironmentSupported(): boolean {
        return (
            typeof window !== "undefined" &&
            typeof document !== "undefined" &&
            typeof PerformanceObserver !== "undefined" &&
            typeof CompressionStream !== "undefined"
        );
    }

    private eventHandler = (event: Event): void => {
        if (!this.nativeProfiler) {
            return;
        }

        this.events.push({timestamp: Math.round(performance.now()), type: event.type});
    };

    private addEventListeners(): void {
        if (!this.nativeProfiler) {
            return;
        }

        this.config.eventNames.forEach((eventName) => {
            document.addEventListener(eventName, this.eventHandler, {passive: true});
        });
    }

    private removeEventListeners(): void {
        this.config.eventNames.forEach((eventName) => {
            document.removeEventListener(eventName, this.eventHandler);
        });
    }

    private cleanup(): void {
        this.removeEventListeners();
        this.isRunning = false;
        this.nativeProfiler = undefined;
        this.events = [];
    }

    /**
     * Удаляем сэмплы до первого и после последнего события. Полезно при профилировании реакции на события.
     */
    private stripSamplesWithoutEvents(samples: IProfilerSample[], events: IProfiledEvent[]) {
        const minTime = events[0].timestamp;
        const maxTime = events[events.length - 1].timestamp + this.config.durationAfterLastEvent;
        return samples.filter((sample) => sample.timestamp >= minTime && sample.timestamp <= maxTime);
    }

    async processProfile(
        trace: IProfilerTrace,
        sampleInterval: number,
        events: IProfiledEvent[],
    ): Promise<string | null> {
        if (this.config.stripSamplesWithoutEvents) {
            const length = events.length;
            if (length === 0) {
                console.log("No events logged. Profile will not be sent.");
                return null;
            }

            trace.samples = this.stripSamplesWithoutEvents(trace.samples, events);
        }

        // Удаляем параметры из URL ресурсов, чтобы уменьшить размер данных
        trace.resources = trace.resources.map((resource) => resource.split("?")[0]);

        const compressed = await this.compressProfile({events, sampleInterval, trace});
        console.log("Events", events);
        console.log("Trace", trace, compressed.length, "bytes base64");
        return compressed;
    }

    async compressProfile(data: IProfileData): Promise<string> {
        return compressObject(data);
    }
}
