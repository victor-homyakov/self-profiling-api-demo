/** Upload a compressed Profile payload to the demo server. */
export async function uploadProfilePayload(scenario: string, payload: string): Promise<{fileName: string}> {
    const response = await fetch("/api/profiles", {
        method: "POST",
        headers: {
            "Content-Type": "text/plain",
            "X-Scenario": scenario,
        },
        body: payload,
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Upload failed (${response.status}): ${text}`);
    }

    return (await response.json()) as {fileName: string};
}
