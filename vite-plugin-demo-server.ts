import fs from "node:fs";
import path from "node:path";
import type {ServerResponse} from "node:http";
import type {Connect, Plugin, PreviewServer, ViteDevServer} from "vite";

const PROFILES_DIR = path.resolve("profiles");
const PAYLOAD_EXT = ".txt";
/** Profile payloads are gzip+base64 text; 10 MiB is plenty for demo uploads. */
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

class PayloadTooLargeError extends Error {
    override name = "PayloadTooLargeError";
}

function ensureProfilesDir(): void {
    fs.mkdirSync(PROFILES_DIR, {recursive: true});
}

function readBody(req: Connect.IncomingMessage, maxBytes = MAX_UPLOAD_BYTES): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        let total = 0;

        req.on("data", (chunk: Buffer) => {
            total += chunk.length;
            if (total > maxBytes) {
                req.destroy();
                reject(new PayloadTooLargeError());
                return;
            }
            chunks.push(chunk);
        });
        req.on("end", () => resolve(Buffer.concat(chunks)));
        req.on("error", reject);
    });
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(body));
}

const MIME_TYPES: Map<string, string> = new Map([
    [".svg", "image/svg+xml"],
    [".json", "application/json"],
    [".txt", "text/plain; charset=utf-8"],
]);

function attachMiddleware(middlewares: Connect.Server): void {
    middlewares.use(async (req, res, next) => {
        const url = req.url?.split("?")[0] ?? "";

        if (req.method === "POST" && url === "/api/profiles") {
            try {
                ensureProfilesDir();
                const scenario =
                    (req.headers["x-scenario"] as string | undefined)?.replace(/[^a-z0-9_-]/gi, "") || "profile";
                const body = await readBody(req);
                if (!body.length) {
                    sendJson(res, 400, {error: "Empty body"});
                    return;
                }
                const fileName = `${scenario}-${Date.now()}${PAYLOAD_EXT}`;
                const filePath = path.join(PROFILES_DIR, fileName);
                fs.writeFileSync(filePath, body);
                sendJson(res, 201, {fileName, path: filePath});
            } catch (error) {
                if (error instanceof PayloadTooLargeError) {
                    sendJson(res, 413, {error: "Payload too large"});
                    return;
                }
                console.error("[demo-server] upload failed", error);
                sendJson(res, 500, {error: "Upload failed"});
            }
            return;
        }

        if (req.method === "GET" && url === "/api/flamegraphs") {
            try {
                ensureProfilesDir();
                const files = fs
                    .readdirSync(PROFILES_DIR)
                    .filter((name) => name.endsWith(".svg"))
                    .map((name) => {
                        const full = path.join(PROFILES_DIR, name);
                        return {name, mtimeMs: fs.statSync(full).mtimeMs, url: `/profiles/${name}`};
                    })
                    .sort((a, b) => b.mtimeMs - a.mtimeMs);

                // Latest pipeline run: all SVGs sharing the newest mtime bucket (±2s)
                if (!files.length) {
                    sendJson(res, 200, {flamegraphs: []});
                    return;
                }
                const newest = files[0].mtimeMs;
                const flamegraphs = files.filter((f) => newest - f.mtimeMs < 2000);
                sendJson(res, 200, {flamegraphs});
            } catch (error) {
                console.error("[demo-server] list flamegraphs failed", error);
                sendJson(res, 500, {error: "List failed"});
            }
            return;
        }

        if (req.method === "GET" && url.startsWith("/profiles/")) {
            if (url.includes("..")) {
                res.statusCode = 400;
                res.end("Bad path");
                return;
            }

            const name = path.basename(url);
            const ext = path.extname(name);
            const type = MIME_TYPES.get(ext);
            if (!type) {
                res.statusCode = 400;
                res.end("Bad path");
                return;
            }

            const filePath = path.join(PROFILES_DIR, name);
            if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
                res.statusCode = 404;
                res.end("Not found");
                return;
            }

            res.statusCode = 200;
            res.setHeader("Content-Type", type);
            fs.createReadStream(filePath).pipe(res);
            return;
        }

        next();
    });
}

function attach(server: ViteDevServer | PreviewServer): void {
    ensureProfilesDir();
    attachMiddleware(server.middlewares);
}

/** Upload Profile payloads and serve pipeline outputs under /profiles. */
export function demoServerPlugin(): Plugin {
    return {
        name: "demo-server",
        configureServer: attach,
        configurePreviewServer: attach,
    };
}

export {PROFILES_DIR};
