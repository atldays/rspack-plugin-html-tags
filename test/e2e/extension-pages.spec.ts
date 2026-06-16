import * as path from "node:path";
import * as cheerio from "cheerio";
import {cleanup, compile, FIXTURES_PATH} from "../helpers/compile";

// Smoke tests for the real-world browser-extension scenario (the addon-bone use
// case): injecting a CSP <meta> and vendor <script>s with attributes into an
// MV2/MV3-style extension page. Extension pages are plain HTML, so the same
// flow covers both manifest versions.
const POPUP_HTML = path.join(FIXTURES_PATH, "popup.html");

describe("extension pages (MV2/MV3 smoke)", () => {
    it("injects a CSP meta and a prepended vendor script into a popup page", async () => {
        const result = await compile({
            htmlOptions: {template: POPUP_HTML, filename: "popup.html", minify: false},
            options: {
                append: false,
                publicPath: false,
                metas: [
                    {
                        attributes: {
                            "http-equiv": "Content-Security-Policy",
                            content: "script-src 'self'; object-src 'self'",
                        },
                    },
                ],
                scripts: [{path: "vendor/runtime.js", attributes: {id: "vendor-runtime"}}],
            },
        });

        expect(result.error).toBeFalsy();
        expect(result.errors).toHaveLength(0);

        const $ = cheerio.load(result.html("popup.html"));

        expect($('meta[http-equiv="Content-Security-Policy"]')).toBeTag({
            tagName: "meta",
            attributes: {"http-equiv": "Content-Security-Policy", content: "script-src 'self'; object-src 'self'"},
        });
        expect($('script[src="vendor/runtime.js"]')).toBeTag({
            tagName: "script",
            attributes: {src: "vendor/runtime.js", id: "vendor-runtime"},
        });
        // append:false → the vendor script is prepended before the page's own bundle.
        expect($($("script").get(0))).toBeTag({tagName: "script", attributes: {src: "vendor/runtime.js"}});

        cleanup(result.outputDir);
    });

    it("applies a CDN public path to injected extension assets", async () => {
        const result = await compile({
            htmlOptions: {template: POPUP_HTML, filename: "popup.html", minify: false},
            options: {
                append: true,
                publicPath: "https://cdn.example.com/ext/",
                scripts: ["analytics.js"],
            },
        });

        expect(result.error).toBeFalsy();
        expect(result.errors).toHaveLength(0);

        const $ = cheerio.load(result.html("popup.html"));
        expect($('script[src="https://cdn.example.com/ext/analytics.js"]')).toBeTag({
            tagName: "script",
            attributes: {src: "https://cdn.example.com/ext/analytics.js"},
        });

        cleanup(result.outputDir);
    });
});
