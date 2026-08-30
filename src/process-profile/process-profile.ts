import fs from "node:fs";
import path from "node:path";

import {decompressObject} from "../profiler/codec";
import type {IProfileData} from "../profiler/profiler";

import {convertProfile} from "./converter";
import {generateFlamegraphs} from "./flamegraph";
import {findAllResources, mergeProfiles} from "./merger";
import {foldProfiles, writeFoldedProfiles} from "./stack-collapse";
import {applySourceMappingToProfile, loadSourceMaps} from "./source-mapping";

interface IProfileDataWithBaseName extends IProfileData {
    baseName: string;
}

function isProfilePayloadFile(name: string): boolean {
    return name.endsWith(".txt") && !name.includes("-folded-") && !name.endsWith("-resources.txt");
}

async function loadProfilesFromPath(inputPath: string): Promise<IProfileDataWithBaseName[]> {
    const resolved = path.resolve(inputPath);
    if (!fs.existsSync(resolved)) {
        console.error(`Path ${resolved} does not exist`);
        process.exit(1);
    }

    const stat = fs.statSync(resolved);
    const files = stat.isDirectory()
        ? fs
              .readdirSync(resolved)
              .filter(isProfilePayloadFile)
              .map((name) => path.join(resolved, name))
              .sort()
        : [resolved];

    if (!files.length) {
        console.error(`No Profile payload .txt files in ${resolved}`);
        process.exit(1);
    }

    console.info("Reading", files.length, "payload file(s) from", resolved);
    const profiles: IProfileDataWithBaseName[] = [];
    for (const filePath of files) {
        const base64 = fs.readFileSync(filePath, "utf8").trim();
        const profile = await decompressObject<IProfileData>(base64);
        (profile as IProfileDataWithBaseName).baseName = path.basename(filePath, path.extname(filePath));
        profiles.push(profile as IProfileDataWithBaseName);
    }

    return profiles;
}

/**
 * Очистка и унификация ресурса:
 * - удаление get-параметров
 * - унификация скриптов, задеплоенных на разные домены, в один
 * - унификация и анонимизация путей `/resource/:id`
 */
function cleanupResource(resource: string): string {
    resource = resource.split("?")[0]!;
    /*
    // Примеры того, что можно и нужно унифицировать:
    // Ресурсы с доменов `mc.yandex.*` объединяем в один: это одни и те же скрипты для разных локаций клиентов
    resource = resource.replace(/mc\.yandex\.[\w.]+\/metrika/, "mc.yandex.xx/metrika");
    // Объединяем домены, если их несколько
    resource = resource.replace(/(?:alias1|alias2)\.com\//, "main-domain.com/");
    resource = resource.replace(/\bmain-domain\.(\w\w|com|com\.tr)\//, "main-domain.com/");
    // Объединяем инлайн-скрипты с однотипных страниц /article/id1.html и /article/id2.html
    resource = resource.replace(/\/article\/\d+$/, "/article/12345");
    */
    return resource;
}

/**
 * Очистка профилей:
 * - удаление пустых профилей (без сэмплов)
 * - очистка и дедупликация ресурсов
 * - сортировка по "насыщенности": первыми идут профили с максимальным соотношением сэмплов к событиям
 */
function cleanupProfiles<T extends IProfileData>(profiles: T[]): T[] {
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

function outputDirFor(inputPath: string): string {
    const resolved = path.resolve(inputPath);
    return fs.statSync(resolved).isDirectory() ? resolved : path.dirname(resolved);
}

async function run(): Promise<void> {
    const command = process.argv[2];
    const inputPath = process.argv[3] ?? "profiles";

    if (!command) {
        console.error(
            "Usage: npm run process-profile -- <traces|fold|download-maps|resources|merge|top> [profiles-dir]",
        );
        process.exit(1);
    }

    console.info("Command:", command, "Input:", inputPath);

    const outDir = outputDirFor(inputPath);
    const sourceMapsDir = path.join(outDir, "source-maps");

    let profiles = await loadProfilesFromPath(inputPath);
    profiles = cleanupProfiles(profiles);

    if (!profiles.length) {
        console.error("No profiles with samples found");
        process.exit(1);
    }

    console.info("Found", profiles.length, "profiles");

    const resources = findAllResources(profiles);

    switch (command) {
        case "top": {
            await loadSourceMaps(resources, sourceMapsDir);
            const TOP = 5;
            const topProfiles = profiles.slice(0, TOP);
            // Free memory
            profiles.length = 0;
            console.info(`Writing top ${topProfiles.length} profiles to ${outDir}`);

            for (let i = 0; i < topProfiles.length; i++) {
                const name = `top-${i}`;
                const profile = applySourceMappingToProfile(topProfiles[i]!);
                const folded = foldProfiles([profile]);

                fs.writeFileSync(path.join(outDir, `${name}.json`), JSON.stringify(profile, null, 2));
                fs.writeFileSync(path.join(outDir, `${name}.trace.json`), convertProfile(profile).toJSON());
                await writeFoldedProfiles(folded, outDir, name);
            }

            break;
        }

        case "merge": {
            const TOP = 20;
            const topProfiles = profiles.slice(0, TOP);
            // Free memory
            profiles.length = 0;
            console.info(`Merging first ${topProfiles.length} profiles into single merged.trace.json...`);
            const mergedProfile = await mergeProfiles(topProfiles);
            fs.writeFileSync(path.join(outDir, `merged.trace.json`), convertProfile(mergedProfile).toJSON());
            break;
        }

        case "traces": {
            await loadSourceMaps(resources, sourceMapsDir);
            console.info(`Converting ${profiles.length} profiles to traces...`);
            const empty: IProfileDataWithBaseName = {
                baseName: "",
                events: [],
                sampleInterval: 0,
                trace: {
                    frames: [],
                    resources: [],
                    samples: [],
                    stacks: [],
                },
            };

            for (let i = 0; i < profiles.length; i++) {
                const profile = applySourceMappingToProfile(profiles[i]);
                const tracePath = path.join(outDir, `${profiles[i].baseName}.trace.json`);
                // Free memory
                profiles[i] = empty;
                fs.writeFileSync(tracePath, convertProfile(profile).toJSON());
                console.info("Wrote", tracePath);
            }

            break;
        }

        case "fold": {
            await loadSourceMaps(resources, sourceMapsDir);
            console.info("Folding", profiles.length, "profiles...");
            const mapped = profiles.map((p) => applySourceMappingToProfile(p));
            // Free memory; actually not so much because all refs are still contained in `mapped`
            profiles.length = 0;

            const foldedProfiles = foldProfiles(mapped);
            // Free memory
            mapped.length = 0;

            const foldedFiles = await writeFoldedProfiles(foldedProfiles, outDir, "aggregated");
            generateFlamegraphs(foldedFiles);
            break;
        }

        case "resources": {
            console.info("Found", resources.length, "resources. Writing to profiles-resources.txt...");
            fs.writeFileSync(path.join(outDir, "profiles-resources.txt"), resources.join("\n"));
            break;
        }

        case "download-maps": {
            console.info("Downloading source maps...");
            await loadSourceMaps(resources, sourceMapsDir);
            break;
        }

        default: {
            console.error("Invalid command", command);
            process.exit(1);
        }
    }
}

void run().catch((e) => {
    console.error(e);
    process.exit(1);
});
