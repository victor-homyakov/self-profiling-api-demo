import {performance} from "node:perf_hooks";

/**
 * Executes a function and logs the execution time
 * @param label - Label for the timer
 * @param fn - Function to execute
 * @returns Promise with the result of the function
 */
export async function withTimer<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();

    try {
        return await fn();
    } finally {
        console.info(`${label} took ${(performance.now() - start).toFixed(2)}ms`);
    }
}
