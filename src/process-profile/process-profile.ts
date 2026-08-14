import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

import {decompressObject} from "../profiler/codec";
import type {IProfileData} from "../profiler/profiler";

import {convertProfile} from "./converter";
import {findAllResources, mergeProfiles} from "./merger";
import {foldProfiles, writeFoldedProfiles} from "./stack-collapse";
import {applySourceMappingToProfile, loadSourceMaps} from "./source-mapping";

async function processFile(fileName: string): Promise<IProfileData[]> {
    const fileExists = fs.existsSync(fileName);

    if (!fileExists) {
        console.error(`File ${fileName} does not exist`);
        process.exit(1);
    }

    console.info("Reading file", fileName);

    const fileStream = fs.createReadStream(fileName);
    const reader = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    });
    let firstLine = true;

    const closePromise = new Promise<void>((resolve) => {
        reader.on("close", () => {
            resolve();
        });
    });

    const promises: Promise<IProfileData>[] = [];

    reader.on("line", (line) => {
        if (firstLine) {
            // В первой строке находится заголовок
            firstLine = false;
        } else {
            promises.push(processLine(line));
        }
    });

    await closePromise;

    return await Promise.all(promises);
}

async function processLine(line: string): Promise<IProfileData> {
    const [base64] = line.split("\t");

    return decompressObject<IProfileData>(base64);
}

function cleanupResource(resource: string): string {
    // удаляем параметры из URL ресурсов
    resource = resource.split("?")[0];
    // унифицируем URL доменов
    resource = resource.replace(/mc\.yandex\.[\w.]+\/metrika/, "mc.yandex.xx/metrika");
    resource = resource.replace(/(?:alias1|alias2)\.com\//, "main-domain.com/");
    resource = resource.replace(/\bmain-domain\.(\w\w|com|com\.tr)\//, "main-domain.com/");
    // унифицируем id ресурсов
    resource = resource.replace(/\/article\/\d+$/, "/article/12345");
    resource = resource.replace(/\/user\/\d+$/, "/user/12345");

    return resource;
}

function cleanupProfiles(profiles: IProfileData[]): IProfileData[] {
    // исключаем профили без сэмплов
    profiles = profiles.filter((profile) => profile.trace.samples.length > 0);

    const resourceCache = new Map<string, string>();

    for (const profile of profiles) {
        profile.trace.resources = profile.trace.resources.map((resource) => {
            if (resourceCache.has(resource)) {
                return resourceCache.get(resource) || "";
            }

            const cleanedResource = cleanupResource(resource);

            resourceCache.set(resource, cleanedResource);

            return cleanedResource;
        });
    }

    return profiles.sort(
        (a, b) => b.trace.samples.length / (b.events.length + 1) - a.trace.samples.length / (a.events.length + 1),
    );
}

async function run() {
    const command = process.argv[3];
    const fileName = process.argv[4];

    console.info("Command:", command, "File name:", fileName);

    const parsed = path.parse(fileName);
    let profiles = await processFile(fileName);

    profiles = cleanupProfiles(profiles);

    if (!profiles.length) {
        console.error("No profiles with samples found");
        process.exit(1);
    }

    console.info("Found", profiles.length, "profiles");

    const resources = findAllResources(profiles);

    switch (command) {
        case "top": {
            await loadSourceMaps(resources, path.join(parsed.dir, "source-maps"));
            const TOP = 5;

            console.info("Writing top", TOP, "profiles to", parsed.dir);

            for (let i = 0; i < Math.min(profiles.length, TOP); i++) {
                const name = `${parsed.name}-${i}`;
                const profile = applySourceMappingToProfile(profiles[i]);
                const foldedProfiles = foldProfiles([profile]);

                fs.writeFileSync(path.join(parsed.dir, `${name}.json`), JSON.stringify(profile, null, 2));
                fs.writeFileSync(path.join(parsed.dir, `${name}.trace.json`), convertProfile(profile).toJSON());
                writeFoldedProfiles(foldedProfiles, parsed.dir, name);
            }

            break;
        }

        case "merge": {
            const TOP = 20;

            console.info(`Merging first ${TOP} profiles into single profile...`);
            const mergedProfile = await mergeProfiles(profiles.slice(0, TOP));

            fs.writeFileSync(
                path.join(parsed.dir, `${parsed.name}-merged.trace.json`),
                convertProfile(mergedProfile).toJSON(),
            );
            break;
        }

        case "fold": {
            await loadSourceMaps(resources, path.join(parsed.dir, "source-maps"));
            console.info("Folding", profiles.length, "profiles...");

            const foldedProfiles = foldProfiles(profiles);

            // Free memory
            profiles.length = 0;
            writeFoldedProfiles(foldedProfiles, parsed.dir, parsed.name);
            break;
        }

        case "resources": {
            console.info("Finding all resources...");
            console.info("Found", resources.length, "resources");
            fs.writeFileSync(path.join(parsed.dir, `${parsed.name}-resources.txt`), resources.join("\n"));
            break;
        }

        case "download-maps": {
            console.info("Downloading source maps...");
            await loadSourceMaps(resources, path.join(parsed.dir, "source-maps"));
            break;
        }

        default: {
            console.error("Invalid command", command);
            process.exit(1);
        }
    }
}

void run();
