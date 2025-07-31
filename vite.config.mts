import {defineConfig} from "vite";
import checker from "vite-plugin-checker";
import dts from "vite-plugin-dts";

export default defineConfig(({command, mode, ssrBuild}) => {
    const isProduction = mode === "production";
    return ({
        build: {
            outDir: "dist",
            minify: isProduction,
            emptyOutDir: true,
            lib: {
                entry: "src/index.ts",
                formats: ["es"],
                name: "configurator-framer-host",
                fileName: "index"
            },
            rollupOptions: {
                treeshake: isProduction ? "recommended" : false
            },
        },
        plugins: [
            checker({typescript: true}),
            ...(isProduction ? [dts({rollupTypes: true})] : [])
        ],
        preview: {
            port: 3000
        }
    });
});