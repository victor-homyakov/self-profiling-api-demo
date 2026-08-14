import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({mode}) => {
    const isProfiling = mode === "profiling";

    return {
        plugins: [react()],
        resolve: {
            alias: isProfiling ? [{find: /^react-dom\/client$/, replacement: "react-dom/profiling"}] : undefined,
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
