import fs from "node:fs";
import path from "node:path";

import type {IProfileData} from "../profiler/profiler";
import type {IProfilerFrame, IProfilerStack} from "../profiler/types";

import {getMostWantedPositions, getOriginalPosition} from "./source-mapping";

interface IFoldedProfiles {
    all: Map<string, number>;
    allReversed: Map<string, number>;
    modules: Map<string, number>;
    modules1stParty: Map<string, number>;
    withoutReact: Map<string, number>;
}

function incrementMap(map: Map<string, number>, key: string, increment: number): void {
    map.set(key, (map.get(key) || 0) + increment);
}

function buildFrameName(frame: IProfilerFrame, resources: string[]): string {
    const resourceName = (frame.resourceId !== undefined ? resources[frame.resourceId] : undefined) || "?";
    let resource = resourceName;
    let symbolName = frame.name;

    if (frame.line !== undefined) {
        resource += `:${frame.line}`;

        if (frame.column !== undefined) {
            resource += `:${frame.column}`;
        }
    }

    if (resourceName !== "?" && frame.line !== undefined && frame.column !== undefined) {
        const originalPosition = getOriginalPosition(resourceName, frame.line, frame.column);

        if (originalPosition.source !== null && originalPosition.line !== null && originalPosition.column !== null) {
            // console.debug(resourceName, frame.name, frame.line, frame.column, originalPosition);
            resource = `${originalPosition.source}:${originalPosition.line}:${originalPosition.column}`;
            symbolName = originalPosition.name || symbolName;
        }
    }

    return (symbolName || "?") + ` (${resource})`;
}

function foldProfile(profile: IProfileData, foldedProfiles: IFoldedProfiles): void {
    const sampleInterval = profile.sampleInterval;
    const frames = profile.trace.frames;
    const resources = profile.trace.resources;
    const samples = profile.trace.samples;
    const stacks = profile.trace.stacks;

    for (let i = 0; i < samples.length; i++) {
        const {stackId} = samples[i];

        if (stackId === undefined) {
            continue;
        }

        const unrolledStack = [];
        const modulesStack = [];
        let id: number | undefined = stackId;

        while (id !== undefined) {
            const stack: IProfilerStack | undefined = stacks[id];
            const frame: IProfilerFrame | undefined = frames[stack?.frameId];

            if (frame === undefined) {
                console.error("Frame not found for stackId", id);
                break;
            }

            const resourceName = (frame.resourceId !== undefined ? resources[frame.resourceId] : undefined) || "?";

            unrolledStack.unshift(buildFrameName(frame, resources));
            modulesStack.unshift(resourceName);
            id = stack.parentId;
        }

        const stackLine = unrolledStack.join(";");
        const stackWithoutReact = unrolledStack.filter((line) => !line.includes("react")).join(";");
        const modulesStackLine = modulesStack.join(";");
        const stackModules1stParty = modulesStack.filter((line) => !line.includes("react")).join(";");
        const stackLineReversed = unrolledStack.reverse().join(";");

        const nextSample = i < samples.length - 1 ? samples[i + 1] : undefined;
        let duration = nextSample ? nextSample.timestamp - samples[i].timestamp : sampleInterval;

        if (Math.abs(duration - sampleInterval) < 1) {
            // Можем получить 10.120000000111759 или 9.984999999869615, поэтому округляем до sampleInterval
            duration = sampleInterval;
        }

        incrementMap(foldedProfiles.all, stackLine, duration);
        incrementMap(foldedProfiles.allReversed, stackLineReversed, duration);
        incrementMap(foldedProfiles.modules, modulesStackLine, duration);
        incrementMap(foldedProfiles.modules1stParty, stackModules1stParty, duration);

        if (stackWithoutReact.length > 0) {
            incrementMap(foldedProfiles.withoutReact, stackWithoutReact, duration);
        }
    }
}

export function foldProfiles(profiles: IProfileData[]): IFoldedProfiles {
    const foldedProfiles: IFoldedProfiles = {
        all: new Map(),
        allReversed: new Map(),
        modules: new Map(),
        modules1stParty: new Map(),
        withoutReact: new Map(),
    };

    for (const profile of profiles) {
        foldProfile(profile, foldedProfiles);
    }

    return foldedProfiles;
}

async function writeFoldedProfile(foldedProfile: Map<string, number>, fileName: string): Promise<string> {
    console.info("Writing", foldedProfile.size, "lines to", fileName);

    const output = fs.createWriteStream(fileName, "utf8");
    const sortedStacks = Array.from(foldedProfile.keys()).sort();

    for (const stackLine of sortedStacks) {
        const count = Math.round(foldedProfile.get(stackLine) || 0);

        if (count > 0) {
            output.write(`${stackLine} ${count}\n`);
        }
    }

    await new Promise<void>((resolve, reject) => {
        output.on("finish", resolve);
        output.on("error", reject);
        output.end();
    });
    // Free memory
    foldedProfile.clear();
    return fileName;
}

export async function writeFoldedProfiles(
    foldedProfiles: IFoldedProfiles,
    dir: string,
    namePrefix: string,
): Promise<string[]> {
    const fileNames = [
        await writeFoldedProfile(foldedProfiles.all, path.join(dir, `${namePrefix}-folded-all.txt`)),
        await writeFoldedProfile(foldedProfiles.allReversed, path.join(dir, `${namePrefix}-folded-all-reversed.txt`)),
        await writeFoldedProfile(foldedProfiles.modules, path.join(dir, `${namePrefix}-folded-modules.txt`)),
        await writeFoldedProfile(
            foldedProfiles.modules1stParty,
            path.join(dir, `${namePrefix}-folded-modules-1st-party.txt`),
        ),
        await writeFoldedProfile(foldedProfiles.withoutReact, path.join(dir, `${namePrefix}-folded-without-react.txt`)),
    ];

    console.info("Most wanted source map positions:", getMostWantedPositions(10));
    return fileNames;
}
