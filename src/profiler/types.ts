export interface IProfilerInitOptions {
    /**
     * The desired sample buffer size limit, measured in the number of samples
     */
    maxBufferSize: number;
    /**
     * The application's desired sample interval (in milliseconds)
     * Once started, the true sampling rate is accessible via profiler.sampleInterval
     */
    sampleInterval: number;
}

export interface IProfilerFrame {
    column?: number;
    line?: number;
    name: string;
    resourceId?: number;
}

export interface IProfilerSample {
    stackId?: number;
    timestamp: number;
}

export interface IProfilerStack {
    frameId: number;
    parentId?: number;
}

export interface IProfilerTrace {
    frames: IProfilerFrame[];
    resources: string[];
    samples: IProfilerSample[];
    stacks: IProfilerStack[];
}

export interface IProfiler {
    sampleInterval: number;
    stopped: boolean;
    stop(): Promise<IProfilerTrace>;
}

export interface IWindowWithProfiler extends Window {
    Profiler?: {
        new (options: IProfilerInitOptions): IProfiler;
    };
}

declare global {
    interface Window {
        Profiler?: {
            new (options: IProfilerInitOptions): IProfiler;
        };
    }
}
