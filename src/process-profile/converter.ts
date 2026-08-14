import type {IProfileData} from "../profiler/profiler";
import type {IProfilerTrace} from "../profiler/types";

import {type ITraceEventArgs, Trace} from "./trace";

const UNKNOWN_RESOURCE = "unknown resource";

export function convertProfile(profile: IProfileData): Trace {
    const trace = new Trace();

    // Поток, у которого tid === pid, будет отмечен как "main thread"
    trace.setProcessMetadata(1, "Events", 1);
    // trace.setThreadMetadata(1, 'event');
    trace.setProcessMetadata(2, "Samples", 2);
    trace.setThreadMetadata(2, UNKNOWN_RESOURCE);
    trace.setThreadMetadata(2, "sample");

    const t = profile.trace;
    const sampleInterval = profile.sampleInterval;

    const allEventTypes = new Set<string>();

    for (const event of profile.events) {
        allEventTypes.add(event.type);
    }

    for (const eventType of allEventTypes) {
        trace.setThreadMetadata(1, eventType);
    }

    for (const event of profile.events) {
        // trace.completeEvent('event', event.type, {}, event.timestamp, event.timestamp + sampleInterval / 2);
        trace.completeEvent(event.type, event.type, {}, event.timestamp, event.timestamp + sampleInterval / 2);
        // trace.asyncEvent('event', event.type, {}, event.timestamp, event.timestamp + sampleInterval / 2);
    }

    for (const sample of t.samples) {
        addStack(trace, t, sample.stackId, sample.timestamp, sample.timestamp + sampleInterval);
        addResource(trace, t, sample.stackId, sample.timestamp, sample.timestamp + sampleInterval);
    }

    return trace;
}

function addStack(trace: Trace, t: IProfilerTrace, stackId: number | undefined, begin: number, end: number): void {
    const stack = stackId !== undefined ? t.stacks[stackId] : undefined;
    const parentId = stack?.parentId;

    if (parentId !== undefined) {
        addStack(trace, t, parentId, begin, end);
    }

    const frameId = stack?.frameId;
    const frame = frameId !== undefined ? t.frames[frameId] : undefined;
    const resourceId = frame?.resourceId;
    const resource = resourceId !== undefined ? t.resources[resourceId] : undefined;
    const name = frame?.name;

    if (name !== undefined) {
        const args: ITraceEventArgs = frame ? {...frame} : {};

        if (resource) {
            args.resource = resource;
        }

        trace.completeEvent("sample", name, args, begin, end, 2);
    }
}

function addResource(trace: Trace, t: IProfilerTrace, stackId: number | undefined, begin: number, end: number): void {
    const stack = stackId !== undefined ? t.stacks[stackId] : undefined;
    const frameId = stack?.frameId;
    const frame = frameId !== undefined ? t.frames[frameId] : undefined;
    const resourceId = frame?.resourceId;
    const resource = resourceId !== undefined ? t.resources[resourceId] : undefined;
    const name = frame?.name;

    if (name !== undefined) {
        const args: ITraceEventArgs = frame ? {...frame} : {};

        if (resource) {
            args.resource = resource;
        }

        trace.setThreadMetadata(2, resource || UNKNOWN_RESOURCE);
        trace.completeEvent(resource || UNKNOWN_RESOURCE, name, args, begin, end, 2);
    }
}
