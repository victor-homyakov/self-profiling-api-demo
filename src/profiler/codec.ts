/**
 * Decompresses a base64-encoded gzip-compressed string into an object.
 */
export async function decompressObject<T>(compressed: string): Promise<T> {
    const decompressed = await decompressStringFromArray(base64ToUint8Array(compressed) as unknown as BufferSource);

    return JSON.parse(decompressed) as T;
}

/**
 * Returns a base64-encoded gzip-compressed string representation of the object.
 */
export async function compressObject<T>(object: T): Promise<string> {
    const compressed = await compressStringToArray(JSON.stringify(object));

    return uint8ArrayToBase64(compressed);
}

async function compressStringToArray(text: string): Promise<Uint8Array> {
    const stream = new CompressionStream("gzip");
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    // Записываем данные
    writer.write(new TextEncoder().encode(text));
    writer.close();

    // Читаем сжатые данные
    const chunks: Uint8Array[] = [];

    while (true) {
        const {value, done} = await reader.read();

        if (value) {
            chunks.push(value);
        }

        if (done) {
            break;
        }
    }

    return mergeUint8Arrays(chunks);
}

async function decompressStringFromArray(compressedData: BufferSource): Promise<string> {
    const stream = new DecompressionStream("gzip");
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    writer.write(compressedData);
    writer.close();

    const chunks: Uint8Array[] = [];

    while (true) {
        const {value, done} = await reader.read();

        if (value) {
            chunks.push(value);
        }

        if (done) {
            break;
        }
    }

    const decompressed = mergeUint8Arrays(chunks);

    return new TextDecoder().decode(decompressed);
}

function mergeUint8Arrays(chunks: Uint8Array[]): Uint8Array {
    if (chunks.length === 0) {
        return new Uint8Array();
    }

    if (chunks.length === 1) {
        return chunks[0];
    }

    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
    }

    return result;
}

function uint8ArrayToBase64(uint8Array: Uint8Array): string {
    return btoa(String.fromCharCode(...uint8Array));
}

function base64ToUint8Array(base64: string): Uint8Array {
    return new Uint8Array(
        atob(base64)
            .split("")
            .map((char) => char.charCodeAt(0)),
    );
}
