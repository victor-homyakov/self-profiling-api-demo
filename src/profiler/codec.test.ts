import {gunzipSync, gzipSync} from "node:zlib";

import {compressObject, decompressObject} from "./codec";

describe("codec", () => {
    describe("compressObject + decompressObject", () => {
        it("should round-trip a plain object", async () => {
            const object = {a: 1, b: "text", c: [1, 2, 3], d: {nested: true}, e: null, f: false};

            const decompressed = await decompressObject<typeof object>(await compressObject(object));

            expect(decompressed).toEqual(object);
        });

        it("should round-trip unicode text", async () => {
            const object = {text: "Привет, мир! 你好 🚀"};

            const decompressed = await decompressObject<typeof object>(await compressObject(object));

            expect(decompressed).toEqual(object);
        });

        it("should round-trip an empty object", async () => {
            const decompressed = await decompressObject<object>(await compressObject({}));

            expect(decompressed).toEqual({});
        });

        it("should round-trip payloads larger than the 32 KiB base64 chunk size", async () => {
            const object = {
                data: Array.from({length: 200_000}, () =>
                    String.fromCharCode(33 + Math.floor(Math.random() * 94)),
                ).join(""),
            };

            const decompressed = await decompressObject<typeof object>(await compressObject(object));

            expect(decompressed).toEqual(object);
        });

        it("should produce base64-encoded gzip readable by node:zlib", async () => {
            const object = {interop: true, n: 42};

            const compressed = await compressObject(object);
            const bytes = Buffer.from(compressed, "base64");

            expect(bytes[0]).toBe(0x1f);
            expect(bytes[1]).toBe(0x8b);
            expect(JSON.parse(gunzipSync(bytes).toString("utf8"))).toEqual(object);
        });

        it("should decompress gzip produced by node:zlib", async () => {
            const object = {interop: true, n: 42};
            const compressed = gzipSync(JSON.stringify(object)).toString("base64");

            expect(await decompressObject(compressed)).toEqual(object);
        });
    });

    describe("decompressObject errors", () => {
        it("should reject on invalid base64", async () => {
            await expect(decompressObject("not base64!!!")).rejects.toThrow();
        });

        it("should reject on valid base64 that is not gzip", async () => {
            const notGzip = Buffer.from("plain text, not gzip").toString("base64");

            await expect(decompressObject(notGzip)).rejects.toThrow();
        });
    });
});
