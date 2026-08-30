import type {IProfileData, IProfiledEvent} from "../profiler/profiler";
import type {IProfilerFrame, IProfilerSample, IProfilerStack, IProfilerTrace} from "../profiler/types";

import {withTimer} from "./with-timer";

export function findAllResources(profiles: IProfileData[]): Array<string> {
    const resources = new Set<string>();

    for (const profile of profiles) {
        for (const resource of profile.trace.resources) {
            resources.add(resource);
        }
    }

    return Array.from(resources).sort();
}

function findUnusedStacks(trace: IDenormalizedProfilerTrace | IProfilerTrace): Set<number> {
    const unusedStacks = new Set<number>();
    const usedStacks = new Set<number>();

    for (const sample of trace.samples) {
        let id = sample.stackId;

        while (id !== undefined) {
            usedStacks.add(id);
            id = trace.stacks[id].parentId;
        }
    }

    for (let i = 0; i < trace.stacks.length; i++) {
        if (!usedStacks.has(i)) {
            unusedStacks.add(i);
        }
    }

    return unusedStacks;
}

export interface IDenormalizedProfilerFrame extends Omit<IProfilerFrame, "resourceId"> {
    resource?: string;
}

export interface IDenormalizedProfilerTrace extends Omit<IProfilerTrace, "frames" | "resources"> {
    frames: IDenormalizedProfilerFrame[];
}

export interface IDenormalizedProfileData extends Omit<IProfileData, "trace"> {
    trace: IDenormalizedProfilerTrace;
}

export function denormalizeFrames(profile: IProfileData): IDenormalizedProfileData {
    const denormalizedFrames = profile.trace.frames.map((f): IDenormalizedProfilerFrame => {
        const frame: IDenormalizedProfilerFrame = {
            column: f.column,
            line: f.line,
            name: f.name,
        };

        if (f.resourceId !== undefined) {
            frame.resource = profile.trace.resources[f.resourceId];
        }

        return frame;
    });

    return {
        events: profile.events,
        sampleInterval: profile.sampleInterval,
        trace: {
            frames: denormalizedFrames,
            samples: profile.trace.samples,
            stacks: profile.trace.stacks,
        },
    };
}

export function normalizeFrames(profile: IDenormalizedProfileData): IProfileData {
    const resources = new Set<string>();

    for (const frame of profile.trace.frames) {
        const {resource} = frame;

        if (resource !== undefined) {
            resources.add(resource);
        }
    }

    const resourceArray = Array.from(resources).sort();

    const normalizedFrames = profile.trace.frames.map(({column, line, name, resource}): IProfilerFrame => {
        const frame: IProfilerFrame = {column, line, name};
        const resourceIndex = resource !== undefined ? resourceArray.indexOf(resource) : -1;

        if (resourceIndex !== -1) {
            frame.resourceId = resourceIndex;
        }

        return frame;
    });

    return {
        events: profile.events,
        sampleInterval: profile.sampleInterval,
        trace: {
            frames: normalizedFrames,
            resources: resourceArray,
            samples: profile.trace.samples,
            stacks: profile.trace.stacks,
        },
    };
}

export async function mergeFrames(
    frames: IDenormalizedProfilerFrame[],
    framesToMerge: IDenormalizedProfilerFrame[],
): Promise<Map<number, number>> {
    return withTimer("mergeFrames", async () => {
        const lengthBefore = frames.length;
        const frameMapping = new Map<number, number>();

        for (let i = 0; i < framesToMerge.length; i++) {
            const f2 = framesToMerge[i];
            const mergedFrameIndex = frames.findIndex(
                (f) => f.name === f2.name && f.line === f2.line && f.column === f2.column && f.resource === f2.resource,
            );

            if (mergedFrameIndex !== -1) {
                frameMapping.set(i, mergedFrameIndex);
            } else {
                frameMapping.set(i, frames.length);
                frames.push(f2);
            }
        }

        const added = frames.length - lengthBefore;
        const merged = framesToMerge.length - added;
        console.info(`mergeFrames: ${added} frames added, ${merged} frames merged`);

        return frameMapping;
    });
}

export async function mergeStacks(
    stacks: IProfilerStack[],
    stacksToMerge: IProfilerStack[],
    frameMapping: Map<number, number>,
    unusedStacks: Set<number>,
): Promise<Map<number, number>> {
    return withTimer("mergeStacks", async () => {
        const lengthBefore = stacks.length;
        const stackMapping = new Map<number, number>();
        let unmergedFrames = 0;

        while (stackMapping.size < stacksToMerge.length) {
            for (let i = 0; i < stacksToMerge.length; i++) {
                if (stackMapping.has(i)) {
                    continue;
                }

                const {frameId: unmergedFrameId, parentId: unmergedParentId} = stacksToMerge[i];
                const mergedParentId = unmergedParentId !== undefined ? stackMapping.get(unmergedParentId) : undefined;
                if (unmergedParentId !== undefined && mergedParentId === undefined) {
                    // No mapping yet. Continue with other stacks.
                    continue;
                }

                if (unusedStacks.has(i)) {
                    stackMapping.set(i, -1);
                    continue;
                }

                let mergedFrameId = frameMapping.get(unmergedFrameId);
                if (mergedFrameId === undefined) {
                    console.error(
                        `mergeStacks: mapped frame for ${unmergedFrameId} not found, will use ${unmergedFrameId} instead`,
                    );
                    unmergedFrames++;
                    mergedFrameId = unmergedFrameId;
                }
                const mergedStackIndex = stacks.findIndex(
                    (s) => s.frameId === mergedFrameId && s.parentId === mergedParentId,
                );

                if (mergedStackIndex !== -1) {
                    stackMapping.set(i, mergedStackIndex);
                } else {
                    stackMapping.set(i, stacks.length);
                    stacks.push({frameId: mergedFrameId, parentId: mergedParentId});
                }
            }
        }

        const added = stacks.length - lengthBefore;
        const merged = stacksToMerge.length - added - unusedStacks.size;
        console.info(
            `mergeStacks: ${added} stacks added, ${merged} stacks merged, ${unusedStacks.size} stacks unused, ${unmergedFrames} unmerged frames found`,
        );

        return stackMapping;
    });
}

function mergeSamples(
    samples: IProfilerSample[],
    samplesToMerge: IProfilerSample[],
    stackMapping: Map<number, number>,
    timestampOffset: number,
): void {
    for (let i = 0; i < samplesToMerge.length; i++) {
        const {stackId, timestamp} = samplesToMerge[i];
        const newSample: IProfilerSample = {
            timestamp: timestampOffset + timestamp,
        };

        if (stackId !== undefined) {
            newSample.stackId = stackMapping.get(stackId);
        }

        if (newSample.stackId === -1) {
            console.error(`mergeSamples: stack ${stackId} should be unused\nsample:`, samplesToMerge[i]);
        }

        samples.push(newSample);
    }
}

function mergeEvents(events: IProfiledEvent[], eventsToMerge: IProfiledEvent[], timestampOffset: number): void {
    for (let i = 0; i < eventsToMerge.length; i++) {
        const {timestamp, type} = eventsToMerge[i];
        events.push({timestamp: timestampOffset + timestamp, type});
    }
}

async function mergeTraces(
    p1: IDenormalizedProfileData,
    p2: IDenormalizedProfileData,
): Promise<IDenormalizedProfileData> {
    const frameMapping = await mergeFrames(p1.trace.frames, p2.trace.frames);
    const unusedStacks = findUnusedStacks(p2.trace);
    const stackMapping = await mergeStacks(p1.trace.stacks, p2.trace.stacks, frameMapping, unusedStacks);

    const lengthBefore = p1.trace.samples.length;
    const timestampOffset = lengthBefore > 0 ? p1.trace.samples[lengthBefore - 1].timestamp + p2.sampleInterval : 0;

    mergeSamples(p1.trace.samples, p2.trace.samples, stackMapping, timestampOffset);
    mergeEvents(p1.events, p2.events, timestampOffset);
    p1.sampleInterval = Math.min(p1.sampleInterval, p2.sampleInterval);

    return p1;
}

export async function mergeProfiles(profiles: IProfileData[]): Promise<IProfileData> {
    const mergedProfile: IDenormalizedProfileData = {
        events: [],
        sampleInterval: Number.MAX_SAFE_INTEGER,
        trace: {
            frames: [],
            samples: [],
            stacks: [],
        },
    };

    let lastTime = Date.now();

    for (let i = 0; i < profiles.length; i++) {
        const profile = profiles[i];
        if (profile.trace.samples.length === 0) {
            continue;
        }

        await mergeTraces(mergedProfile, denormalizeFrames(profile));

        const currentTime = Date.now();
        if (currentTime - lastTime > 1000) {
            console.info("Merged", i, "of", profiles.length, "profiles");
            lastTime = currentTime;
        }

        if (i % 100 === 0) {
            try {
                console.info("Profile size ≈", JSON.stringify(mergedProfile).length / 1024, "KB");
            } catch (_error) {
                console.error("Profile is too large", i);
                break;
            }
        }
    }

    return normalizeFrames(mergedProfile);
}
