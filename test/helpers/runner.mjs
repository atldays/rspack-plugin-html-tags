// Runs a single real Rspack build in a clean Node ESM process (outside jest's
// module sandbox, which cannot resolve rspack's file:// loader URLs). Reads the
// build params from `<outputDir>/__params.json`, writes `{error, errors}` to
// `<outputDir>/__result.json`. Functions are transported as {__fn__: source}.
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {CopyRspackPlugin, CssExtractRspackPlugin, HtmlRspackPlugin, rspack} from "@rspack/core";
import HtmlRspackTagsPlugin from "../../dist/index.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_PATH = path.join(here, "..", "fixtures");
const FIXTURES_ENTRY = path.join(FIXTURES_PATH, "entry.js");
const FIXTURES_STYLE = path.join(FIXTURES_PATH, "app.css");

const outputDir = process.argv[2];
const resultPath = path.join(outputDir, "__result.json");

function revive(value) {
    if (Array.isArray(value)) {
        return value.map(revive);
    }
    if (value && typeof value === "object") {
        if (typeof value.__fn__ === "string") {
            return (0, eval)("(" + value.__fn__ + ")");
        }
        const out = {};
        for (const [key, val] of Object.entries(value)) {
            out[key] = revive(val);
        }
        return out;
    }
    return value;
}

function writeResult(result) {
    fs.writeFileSync(resultPath, JSON.stringify(result));
}

try {
    const params = revive(JSON.parse(fs.readFileSync(path.join(outputDir, "__params.json"), "utf8")));
    const {webpackEntry, webpackStyle, webpackPublicPath, copyOptions, htmlOptions, options} = params;

    const copyPlugins = copyOptions ? [new CopyRspackPlugin({patterns: copyOptions})] : [];
    const htmlPlugins = htmlOptions === false ? [] : [new HtmlRspackPlugin(htmlOptions ?? {})];
    const tagsPlugins = Array.isArray(options)
        ? options.map(opts => new HtmlRspackTagsPlugin(opts))
        : options === false || options === undefined
          ? []
          : [new HtmlRspackTagsPlugin(options)];

    const config = {
        entry: {app: webpackEntry ?? FIXTURES_ENTRY, style: webpackStyle ?? FIXTURES_STYLE},
        output: {
            path: outputDir,
            filename: "[name].js",
            ...(webpackPublicPath !== undefined ? {publicPath: webpackPublicPath} : {}),
        },
        module: {rules: [{test: /\.css$/, use: [CssExtractRspackPlugin.loader, "css-loader"]}]},
        plugins: [new CssExtractRspackPlugin({filename: "[name].css"}), ...copyPlugins, ...htmlPlugins, ...tagsPlugins],
    };

    rspack(config, (err, stats) => {
        const result = {error: null, errors: []};
        if (err) {
            result.error = err.stack || err.message || String(err);
        }
        if (stats) {
            const json = stats.toJson({all: false, errors: true});
            result.errors = (json.errors ?? []).map(e =>
                typeof e === "string" ? e : (e.message ?? JSON.stringify(e))
            );
        }
        writeResult(result);
        process.exit(0);
    });
} catch (err) {
    writeResult({error: err && err.stack ? err.stack : String(err), errors: []});
    process.exit(0);
}
