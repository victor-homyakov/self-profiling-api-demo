import {execFileSync} from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export function generateFlamegraphs(foldedTxtPaths: string[], width = 1500): string[] {
    const FLAMEGRAPH_PL = path.resolve("tools/FlameGraph/flamegraph.pl");

    if (!fs.existsSync(FLAMEGRAPH_PL)) {
        console.error(`flamegraph.pl not found at ${FLAMEGRAPH_PL}. Run: npm run init:submodules`);
        process.exit(1);
    }

    const svgs: string[] = [];

    for (const foldedPath of foldedTxtPaths) {
        const svgPath = foldedPath.replace(/\.txt$/, ".svg");
        console.info("flamegraph.pl", foldedPath, "→", svgPath);
        const svg = execFileSync("perl", [FLAMEGRAPH_PL, "--width", String(width), foldedPath], {
            encoding: "utf8",
            maxBuffer: 64 * 1024 * 1024,
        });
        fs.writeFileSync(svgPath, svg);
        svgs.push(svgPath);
    }

    return svgs;
}
