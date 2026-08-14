import {foldProfiles} from "./stack-collapse";

describe("stackCollapse", () => {
    it("should fold profiles", () => {
        const foldedProfiles = foldProfiles([
            {
                events: [],
                sampleInterval: 1,
                trace: {
                    frames: [{name: "f1"}, {name: "f2"}],
                    resources: [],
                    samples: [
                        {timestamp: 1, stackId: 0},
                        {timestamp: 2, stackId: 1},
                        {timestamp: 3, stackId: 0},
                    ],
                    stacks: [{frameId: 0}, {frameId: 1, parentId: 0}],
                },
            },
        ]);

        expect(Array.from(foldedProfiles.all.entries())).toEqual([
            ["f1 (?)", 2],
            ["f1 (?);f2 (?)", 1],
        ]);
        expect(Array.from(foldedProfiles.allReversed.entries())).toEqual([
            ["f1 (?)", 2],
            ["f2 (?);f1 (?)", 1],
        ]);
        expect(Array.from(foldedProfiles.modules.entries())).toEqual([
            ["?", 2],
            ["?;?", 1],
        ]);
        expect(Array.from(foldedProfiles.modules1stParty.entries())).toEqual([
            ["?", 2],
            ["?;?", 1],
        ]);
        expect(Array.from(foldedProfiles.withoutReact.entries())).toEqual([
            ["f1 (?)", 2],
            ["f1 (?);f2 (?)", 1],
        ]);
    });
});
