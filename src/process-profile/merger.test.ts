import type {IProfilerStack} from "../profiler/types";

import type {IDenormalizedProfilerFrame} from "./merger";
import {mergeFrames, mergeStacks} from "./merger";

describe("merger", () => {
    // Подавляем console.log в тестах
    beforeEach(() => {
        jest.spyOn(console, "log").mockImplementation();
        jest.spyOn(console, "info").mockImplementation();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("mergeFrames", () => {
        it("should merge frames", async () => {
            const frames: IDenormalizedProfilerFrame[] = [{name: "f1"}];
            const framesToMerge: IDenormalizedProfilerFrame[] = [
                {name: "f2"},
                {name: "f1"},
                {name: "f1", resource: "r1"},
            ];
            const mapping = await mergeFrames(frames, framesToMerge);

            expect(Array.from(mapping.entries())).toEqual([
                [0, 1],
                [1, 0],
                [2, 2],
            ]);
            expect(frames).toEqual([{name: "f1"}, {name: "f2"}, {name: "f1", resource: "r1"}]);
        });
    });

    describe("mergeStacks", () => {
        it("should merge stacks", async () => {
            const stacks: IProfilerStack[] = [{frameId: 0}];
            const stacksToMerge: IProfilerStack[] = [
                {frameId: 0},
                {frameId: 1, parentId: 0},
                {frameId: 0},
                {frameId: 1},
            ];
            const frameMapping = new Map([
                [0, 0],
                [1, 1],
            ]);
            const mapping = await mergeStacks(stacks, stacksToMerge, frameMapping, new Set());

            expect(stacks).toEqual([{frameId: 0}, {frameId: 1, parentId: 0}, {frameId: 1}]);
            expect(Array.from(mapping.entries())).toEqual([
                [0, 0],
                [1, 1],
                [2, 0],
                [3, 2],
            ]);
        });

        it("should dedupe child stacks using mapped parent index, not source parentId", async () => {
            // Profile 1 has a filler stack at index 0, and then its stacks are identical to profile 2 with offset 1.
            // Should recognize the parent of `stacksToMerge[1]` as `stacksToMerge[0]` and map it to `stacks[1]`.
            const stacks: IProfilerStack[] = [
                {frameId: 10},
                {frameId: 0},
                {frameId: 1, parentId: 1},
                {frameId: 2, parentId: 2},
            ];
            const stacksToMerge: IProfilerStack[] = [
                {frameId: 0},
                {frameId: 1, parentId: 0},
                {frameId: 2, parentId: 1},
            ];
            // Frame ids match between two profiles for simplicity
            const frameMapping = new Map([
                [0, 0],
                [1, 1],
                [2, 2],
            ]);
            const mapping = await mergeStacks(stacks, stacksToMerge, frameMapping, new Set());

            expect(stacks).toEqual([{frameId: 10}, {frameId: 0}, {frameId: 1, parentId: 1}, {frameId: 2, parentId: 2}]);
            expect(Array.from(mapping.entries())).toEqual([
                [0, 1],
                [1, 2],
                [2, 3],
            ]);
        });

        it("should not dedupe child stacks when mapped parent differs from source parentId", async () => {
            // stacksToMerge[1] is frame 1 under stacksToMerge[0] (frame 2), not under root frame 0.
            const stacks: IProfilerStack[] = [{frameId: 0}, {frameId: 1, parentId: 0}, {frameId: 2}];
            const stacksToMerge: IProfilerStack[] = [{frameId: 2}, {frameId: 1, parentId: 0}];
            // Frame ids match between two profiles for simplicity
            const frameMapping = new Map([
                [2, 2],
                [1, 1],
            ]);
            const mapping = await mergeStacks(stacks, stacksToMerge, frameMapping, new Set());

            expect(stacks).toEqual([{frameId: 0}, {frameId: 1, parentId: 0}, {frameId: 2}, {frameId: 1, parentId: 2}]);
            expect(Array.from(mapping.entries())).toEqual([
                [0, 2],
                [1, 3],
            ]);
        });
    });
});
