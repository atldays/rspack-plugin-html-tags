import {defineConfig} from "tsup";

export default defineConfig({
    entry: {index: "src/index.ts"},
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    sourcemap: true,
    treeshake: true,
    splitting: false,
    // The single default export makes esbuild emit `module.exports =
    // HtmlRspackTagsPlugin` natively, so `require("@rspackjs/plugin-html-tags")`
    // returns the class directly (matching the original package). `cjsInterop`
    // is intentionally NOT enabled — it would append a second
    // `module.exports = exports.default` and clobber the class with undefined.
    target: "node22",
    outExtension({format}) {
        return {js: format === "cjs" ? ".cjs" : ".js"};
    },
    // Peer dependency — never bundle it. (glob/minimatch are runtime deps and
    // are externalized automatically by tsup.)
    external: ["@rspack/core"],
});
