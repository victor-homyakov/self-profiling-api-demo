import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";
import {demoServerPlugin} from "./vite-plugin-demo-server";

export default defineConfig(({mode}) => {
    const isProfiling = mode === "profiling";

    return {
        plugins: [react(), demoServerPlugin()],
        resolve: {
            alias: isProfiling ? [{find: /^react-dom\/client$/, replacement: "react-dom/profiling"}] : undefined,
        },
        build: {
            // Stage build: production bundle with maps for download-maps / Flamegraph names
            sourcemap: true,
        },
        server: {
            port: 5173,
            headers: {
                "Document-Policy": "js-profiling",
            },
        },
        preview: {
            headers: {
                "Document-Policy": "js-profiling",
            },
        },
    };
});
