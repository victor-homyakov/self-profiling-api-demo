import type {IProfilerStack} from "../profiler/types";

import type {IDenormalizedProfilerFrame} from "./merger";
import {mergeFrames, mergeStacks} from "./merger";

describe("merger", () => {
    // Подавляем console.log и logger в тестах
    beforeEach(() => {
        jest.spyOn(console, "log").mockImplementation();
        jest.spyOn(process.stdout, "write").mockImplementation();
        jest.spyOn(process.stderr, "write").mockImplementation();
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
            const mapping = await mergeStacks(stacks, stacksToMerge, new Map([[0, 0]]), new Set());

            expect(stacks).toEqual([{frameId: 0}, {frameId: 1, parentId: 0}, {frameId: 1}]);
            expect(Array.from(mapping.entries())).toEqual([
                [0, 0],
                [1, 1],
                [2, 0],
                [3, 2],
            ]);
        });
    });
});
