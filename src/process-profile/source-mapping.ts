import fs from "node:fs";
import path from "node:path";

import type {InvalidOriginalMapping, OriginalMapping} from "@jridgewell/trace-mapping";
import {originalPositionFor, TraceMap} from "@jridgewell/trace-mapping";

import type {IProfileData} from "../profiler/profiler";

const maps = new Map<string, TraceMap>();

export async function loadSourceMaps(resources: string[], dirToStore: string): Promise<void> {
    const scriptsWithMaps = resources.filter((script) => script.startsWith("http") && script.endsWith(".js"));

    console.info("Found", scriptsWithMaps.length, "scripts");
    console.info("Storing source maps in", dirToStore);
    fs.mkdirSync(dirToStore, {recursive: true});

    const timer = setInterval(() => {
        console.info("Loading source maps...", scriptsWithMaps.length - maps.size, "scripts left");
    }, 1000);

    const promises = scriptsWithMaps.map(async (url) => {
        if (maps.has(url)) {
            return;
        }

        const content = await loadSourceMapForScript(url, dirToStore);

        if (content) {
            maps.set(url, new TraceMap(content));
        }
    });

    await Promise.all(promises);
    clearInterval(timer);
    console.info("Loaded", maps.size, "source maps");
}

async function loadSourceMapForScript(url: string, dirToStore: string): Promise<string | undefined> {
    const sourceMapPath = path.join(dirToStore, `${path.basename(url)}.map`);

    if (fs.existsSync(sourceMapPath)) {
        return fs.readFileSync(sourceMapPath, "utf8");
    }

    console.info("Downloading script", url);
    const response = await fetch(url);
    const scriptContent = await response.text();

    if (!response.ok) {
        console.warn(`Failed to fetch source file: ${response.statusText}`);

        return undefined;
    }

    const PREFIX = "//# sourceMappingURL=";
    const pos = scriptContent.lastIndexOf(PREFIX);

    if (pos === -1) {
        return undefined;
    }

    const sourceMapUrl = scriptContent.slice(pos + PREFIX.length);

    /*
    // Если URL относительный, то преобразуем его в абсолютный
    let sourceMapUrl = scriptContent.slice(pos + PREFIX.length).trim();
    if (!sourceMapUrl.startsWith('http')) {
        const baseUrl = new URL(url);
        sourceMapUrl = new URL(sourceMapUrl, baseUrl).href;
    }
    */

    console.info("Downloading source map", sourceMapUrl);
    const sourceMapResponse = await fetch(sourceMapUrl);
    const sourceMapContent = await sourceMapResponse.text();

    if (!sourceMapResponse.ok) {
        console.warn(`Failed to fetch source map file: ${sourceMapResponse.statusText}`);

        return undefined;
    }

    fs.writeFileSync(sourceMapPath, sourceMapContent);

    return sourceMapContent;
}

type TPosition = `${string}:${number}:${number}`;

function getPosition(url: string, line: number, column: number): TPosition {
    return `${url}:${line}:${column}`;
}

/**
 * Для некоторых файлов нет маппинга, поэтому добавляем маппинг вручную для известных позиций.
 */
const hardCodedPositions = new Map<TPosition, OriginalMapping>([
    [
        // U (react-with-dom.min.js:21:14) -> performWorkUntilDeadline
        getPosition("https://yastatic.net/react/18.2.0/react-with-dom.min.js", 21, 14),
        {source: "react-with-dom.min.js", line: 21, column: 14, name: "performWorkUntilDeadline"},
    ],
    [
        // Aj (react-with-dom.min.js:77:290) -> dispatchDiscreteEvent
        getPosition("https://yastatic.net/react/18.2.0/react-with-dom.min.js", 77, 290),
        {source: "react-with-dom.min.js", line: 77, column: 290, name: "dispatchDiscreteEvent"},
    ],
    [
        // db (react-with-dom.min.js:110:89) -> flushSyncCallbacks
        getPosition("https://yastatic.net/react/18.2.0/react-with-dom.min.js", 110, 89),
        {source: "react-with-dom.min.js", line: 110, column: 89, name: "flushSyncCallbacks"},
    ],
    [
        // Aa (react-with-dom.min.js:201:435) -> recursivelyTraverseMutationEffects
        getPosition("https://yastatic.net/react/18.2.0/react-with-dom.min.js", 201, 435),
        {source: "react-with-dom.min.js", line: 201, column: 435, name: "recursivelyTraverseMutationEffects"},
    ],
    [
        // Gi (react-with-dom.min.js:202:413) -> commitMutationEffectsOnFiber
        getPosition("https://yastatic.net/react/18.2.0/react-with-dom.min.js", 202, 413),
        {source: "react-with-dom.min.js", line: 202, column: 413, name: "commitMutationEffectsOnFiber"},
    ],
    [
        // Ha (react-with-dom.min.js:208:422) -> commitReconciliationEffects
        getPosition("https://yastatic.net/react/18.2.0/react-with-dom.min.js", 208, 422),
        {source: "react-with-dom.min.js", line: 208, column: 422, name: "commitReconciliationEffects"},
    ],
    [
        // ? (react-with-dom.min.js:215:275) -> scheduleMicrotask(function () {
        getPosition("https://yastatic.net/react/18.2.0/react-with-dom.min.js", 215, 275),
        {source: "react-with-dom.min.js", line: 215, column: 275, name: "anonymous"},
    ],
    [
        // Mi (react-with-dom.min.js:220:82) -> performSyncWorkOnRoot
        getPosition("https://yastatic.net/react/18.2.0/react-with-dom.min.js", 220, 82),
        {source: "react-with-dom.min.js", line: 220, column: 82, name: "performSyncWorkOnRoot"},
    ],
    [
        // Nd (react-with-dom.min.js:225:423) -> renderRootSync
        getPosition("https://yastatic.net/react/18.2.0/react-with-dom.min.js", 225, 423),
        {source: "react-with-dom.min.js", line: 225, column: 423, name: "renderRootSync"},
    ],
    [
        // yb (react-with-dom.min.js:227:107) -> dispatchDiscreteEvent
        getPosition("https://yastatic.net/react/18.2.0/react-with-dom.min.js", 227, 107),
        {source: "react-with-dom.min.js", line: 227, column: 107, name: "dispatchDiscreteEvent"},
    ],
    [
        // Sk (react-with-dom.min.js:227:229) -> commitRootImpl
        getPosition("https://yastatic.net/react/18.2.0/react-with-dom.min.js", 227, 229),
        {source: "react-with-dom.min.js", line: 227, column: 229, name: "commitRootImpl"},
    ],
]);

const positionsWanted = new Map<TPosition, number>();

const EMPTY_MAPPING = {source: null, line: null, column: null, name: null};

/**
 * Может вернуть варианты:
 * - { source: null, line: null, column: null, name: null } - нет маппинга для этого скрипта или для этой строки
 * - { source: string, line: number, column: number, name: null } - есть маппинг для этой строки, но нет имени
 * - { source: string, line: number, column: number, name: string } - есть маппинг для этой строки и имя
 */
export function getOriginalPosition(
    url: string,
    line: number,
    column: number,
): InvalidOriginalMapping | OriginalMapping {
    const map = maps.get(url);

    if (!map) {
        const position = getPosition(url, line, column);
        const hardCodedPosition = hardCodedPositions.get(position);

        if (hardCodedPosition) {
            return hardCodedPosition;
        }

        positionsWanted.set(position, (positionsWanted.get(position) ?? 0) + 1);

        return EMPTY_MAPPING;
    }

    return originalPositionFor(map, {line, column: column - 1});
}

export function getMostWantedPositions(count: number): [TPosition, number][] {
    return Array.from(positionsWanted.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, count)
        .map(([position, count]) => [position, count]);
}

export function applySourceMappingToProfile(profile: IProfileData): IProfileData {
    const frames = profile.trace.frames;
    const resources = profile.trace.resources;

    for (const frame of frames) {
        const {resourceId, line, column} = frame;

        if (resourceId === undefined || line === undefined || column === undefined) {
            continue;
        }

        const resource = resources[resourceId];

        if (resource === undefined) {
            continue;
        }

        const originalPosition = getOriginalPosition(resource, line, column);

        if (originalPosition.name) {
            frame.name = originalPosition.name;
        }
    }

    return profile;
}
