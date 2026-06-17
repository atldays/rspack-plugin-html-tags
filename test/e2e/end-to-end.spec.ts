import * as path from "node:path";
import * as cheerio from "cheerio";
import {cleanup, compile, FIXTURES_PATH, hasErrorText} from "../helpers/compile";

// Ported 1:1 from spec/end_to_end.spec.js (jasmine). Each build runs a real
// Rspack 2 compile via the child-process harness. The original ran only the
// `tags`/`link` variant of runTestsForOption (optionTag === 'link'), so the
// `isScript` externals block is intentionally omitted (it was never executed
// upstream). Templates that reference `index.html` include an inline
// `loading-script`, which cheerio counts as a <script> — the original baselines
// already accounted for it, and rspack 2 emits no extra runtime chunk, so the
// counts match the upstream spec verbatim.

const INDEX_HTML = path.join(FIXTURES_PATH, "index.html");
const INDEX_NO_INJECT_HTML = path.join(FIXTURES_PATH, "index-no-inject.html");

describe("end to end", () => {
    describe("html-latest", () => {
        it("should throw an error if html-webpack-plugin is not in the webpack config", async () => {
            const theError = /(are you sure you have HtmlRspackPlugin before it in your rspack config's plugins)/;
            const result = await compile({
                htmlOptions: false,
                options: {
                    tags: "foobar.js",
                    publicPath: false,
                },
            });
            expect(result.error).toBeTruthy();
            expect(result.error).toMatch(theError);
            cleanup(result.outputDir);
        });

        describe("main options", () => {
            describe("options.append", () => {
                it("should include a single js file and append it", async () => {
                    const result = await compile({
                        options: {tags: "foobar.js", append: true, publicPath: false},
                    });
                    expect(result.error).toBeFalsy();
                    expect(result.errors).toHaveLength(0);
                    const $ = cheerio.load(result.html());
                    expect($("script").length).toBe(3);
                    expect($("link").length).toBe(1);
                    expect($('script[src="style.js"]')).toBeTag({tagName: "script", attributes: {src: "style.js"}});
                    expect($('script[src="app.js"]')).toBeTag({tagName: "script", attributes: {src: "app.js"}});
                    expect($('link[href="style.css"]')).toBeTag({
                        tagName: "link",
                        attributes: {href: "style.css", rel: "stylesheet"},
                    });
                    expect($('script[src="foobar.js"]')).toBeTag({tagName: "script", attributes: {src: "foobar.js"}});
                    expect($($("script").get(2))).toBeTag({tagName: "script", attributes: {src: "foobar.js"}});
                    cleanup(result.outputDir);
                });

                it("should include a single css file and append it", async () => {
                    const result = await compile({
                        options: {tags: "foobar.css", append: true, publicPath: false},
                    });
                    expect(result.error).toBeFalsy();
                    expect(result.errors).toHaveLength(0);
                    const $ = cheerio.load(result.html());
                    expect($("script").length).toBe(2);
                    expect($("link").length).toBe(2);
                    expect($('script[src="style.js"]')).toBeTag({tagName: "script", attributes: {src: "style.js"}});
                    expect($('script[src="app.js"]')).toBeTag({tagName: "script", attributes: {src: "app.js"}});
                    expect($('link[href="style.css"]')).toBeTag({
                        tagName: "link",
                        attributes: {href: "style.css", rel: "stylesheet"},
                    });
                    expect($('link[href="foobar.css"]')).toBeTag({
                        tagName: "link",
                        attributes: {href: "foobar.css", rel: "stylesheet"},
                    });
                    expect($($("link").get(1))).toBeTag({
                        tagName: "link",
                        attributes: {href: "foobar.css", rel: "stylesheet"},
                    });
                    cleanup(result.outputDir);
                });

                it("should include a single js file and prepend it", async () => {
                    const result = await compile({
                        options: {tags: "foobar.js", append: false, publicPath: false},
                    });
                    expect(result.error).toBeFalsy();
                    expect(result.errors).toHaveLength(0);
                    const $ = cheerio.load(result.html());
                    expect($("script").length).toBe(3);
                    expect($("link").length).toBe(1);
                    expect($('script[src="style.js"]')).toBeTag({tagName: "script", attributes: {src: "style.js"}});
                    expect($('script[src="app.js"]')).toBeTag({tagName: "script", attributes: {src: "app.js"}});
                    expect($('link[href="style.css"]')).toBeTag({
                        tagName: "link",
                        attributes: {href: "style.css", rel: "stylesheet"},
                    });
                    expect($('script[src="foobar.js"]')).toBeTag({tagName: "script", attributes: {src: "foobar.js"}});
                    expect($($("script").get(0))).toBeTag({tagName: "script", attributes: {src: "foobar.js"}});
                    cleanup(result.outputDir);
                });

                it("should include a single css file and prepend it", async () => {
                    const result = await compile({
                        options: {tags: "foobar.css", append: false, publicPath: false},
                    });
                    expect(result.error).toBeFalsy();
                    expect(result.errors).toHaveLength(0);
                    const $ = cheerio.load(result.html());
                    expect($("script").length).toBe(2);
                    expect($("link").length).toBe(2);
                    expect($('script[src="style.js"]')).toBeTag({tagName: "script", attributes: {src: "style.js"}});
                    expect($('script[src="app.js"]')).toBeTag({tagName: "script", attributes: {src: "app.js"}});
                    expect($('link[href="style.css"]')).toBeTag({
                        tagName: "link",
                        attributes: {href: "style.css", rel: "stylesheet"},
                    });
                    expect($('link[href="foobar.css"]')).toBeTag({
                        tagName: "link",
                        attributes: {href: "foobar.css", rel: "stylesheet"},
                    });
                    expect($($("link").get(0))).toBeTag({
                        tagName: "link",
                        attributes: {href: "foobar.css", rel: "stylesheet"},
                    });
                    cleanup(result.outputDir);
                });

                it("should support appending and prepending at the same time", async () => {
                    const result = await compile({
                        options: [
                            {tags: ["foo.css", "foo.js"], append: false, publicPath: false},
                            {tags: ["bar.css", "bar.js"], append: true, publicPath: false},
                        ],
                    });
                    expect(result.error).toBeFalsy();
                    expect(result.errors).toHaveLength(0);
                    const $ = cheerio.load(result.html());
                    expect($("script").length).toBe(4);
                    expect($("link").length).toBe(3);
                    expect($('script[src="style.js"]')).toBeTag({tagName: "script", attributes: {src: "style.js"}});
                    expect($('script[src="app.js"]')).toBeTag({tagName: "script", attributes: {src: "app.js"}});
                    expect($('script[src="foo.js"]')).toBeTag({tagName: "script", attributes: {src: "foo.js"}});
                    expect($('script[src="bar.js"]')).toBeTag({tagName: "script", attributes: {src: "bar.js"}});
                    expect($($("script").get(0))).toBeTag({tagName: "script", attributes: {src: "foo.js"}});
                    expect($($("script").get(3))).toBeTag({tagName: "script", attributes: {src: "bar.js"}});
                    expect($('link[href="style.css"]')).toBeTag({
                        tagName: "link",
                        attributes: {href: "style.css", rel: "stylesheet"},
                    });
                    expect($('link[href="foo.css"]')).toBeTag({
                        tagName: "link",
                        attributes: {href: "foo.css", rel: "stylesheet"},
                    });
                    expect($('link[href="bar.css"]')).toBeTag({
                        tagName: "link",
                        attributes: {href: "bar.css", rel: "stylesheet"},
                    });
                    expect($($("link").get(0))).toBeTag({
                        tagName: "link",
                        attributes: {href: "foo.css", rel: "stylesheet"},
                    });
                    expect($($("link").get(2))).toBeTag({
                        tagName: "link",
                        attributes: {href: "bar.css", rel: "stylesheet"},
                    });
                    cleanup(result.outputDir);
                });

                it("should support overriding append at the tag level", async () => {
                    const result = await compile({
                        options: [
                            {
                                tags: ["foo.css", {path: "foo.js", append: true}],
                                scripts: "baz.js",
                                append: false,
                                publicPath: false,
                            },
                            {
                                tags: [{path: "bar.css", append: false}, "bar.js"],
                                links: "baz.css",
                                append: true,
                                publicPath: false,
                            },
                        ],
                    });
                    expect(result.error).toBeFalsy();
                    expect(result.errors).toHaveLength(0);
                    const $ = cheerio.load(result.html());
                    expect($("script").length).toBe(5);
                    expect($("link").length).toBe(4);
                    expect($('script[src="style.js"]')).toBeTag({tagName: "script", attributes: {src: "style.js"}});
                    expect($('script[src="app.js"]')).toBeTag({tagName: "script", attributes: {src: "app.js"}});
                    expect($('script[src="foo.js"]')).toBeTag({tagName: "script", attributes: {src: "foo.js"}});
                    expect($('script[src="bar.js"]')).toBeTag({tagName: "script", attributes: {src: "bar.js"}});
                    expect($('script[src="baz.js"]')).toBeTag({tagName: "script", attributes: {src: "baz.js"}});
                    expect($($("script").get(0))).toBeTag({tagName: "script", attributes: {src: "baz.js"}});
                    expect($($("script").get(3))).toBeTag({tagName: "script", attributes: {src: "foo.js"}});
                    expect($($("script").get(4))).toBeTag({tagName: "script", attributes: {src: "bar.js"}});
                    expect($('link[href="style.css"]')).toBeTag({
                        tagName: "link",
                        attributes: {href: "style.css", rel: "stylesheet"},
                    });
                    expect($('link[href="foo.css"]')).toBeTag({
                        tagName: "link",
                        attributes: {href: "foo.css", rel: "stylesheet"},
                    });
                    expect($('link[href="bar.css"]')).toBeTag({
                        tagName: "link",
                        attributes: {href: "bar.css", rel: "stylesheet"},
                    });
                    expect($('link[href="baz.css"]')).toBeTag({
                        tagName: "link",
                        attributes: {href: "baz.css", rel: "stylesheet"},
                    });
                    expect($($("link").get(0))).toBeTag({
                        tagName: "link",
                        attributes: {href: "bar.css", rel: "stylesheet"},
                    });
                    expect($($("link").get(1))).toBeTag({
                        tagName: "link",
                        attributes: {href: "foo.css", rel: "stylesheet"},
                    });
                    expect($($("link").get(3))).toBeTag({
                        tagName: "link",
                        attributes: {href: "baz.css", rel: "stylesheet"},
                    });
                    cleanup(result.outputDir);
                });

                it("should include multiple css files and append them in order", async () => {
                    const result = await compile({
                        options: {
                            tags: ["foo.css", "bar.css", {path: "baz.css"}],
                            append: true,
                            publicPath: false,
                        },
                    });
                    expect(result.error).toBeFalsy();
                    expect(result.errors).toHaveLength(0);
                    const $ = cheerio.load(result.html());
                    expect($("script").length).toBe(2);
                    expect($("link").length).toBe(4);
                    expect($('script[src="style.js"]')).toBeTag({tagName: "script", attributes: {src: "style.js"}});
                    expect($('script[src="app.js"]')).toBeTag({tagName: "script", attributes: {src: "app.js"}});
                    expect($('link[href="style.css"]')).toBeTag({
                        tagName: "link",
                        attributes: {href: "style.css", rel: "stylesheet"},
                    });
                    expect($('link[href="foo.css"]')).toBeTag({
                        tagName: "link",
                        attributes: {href: "foo.css", rel: "stylesheet"},
                    });
                    expect($('link[href="bar.css"]')).toBeTag({
                        tagName: "link",
                        attributes: {href: "bar.css", rel: "stylesheet"},
                    });
                    expect($('link[href="baz.css"]')).toBeTag({
                        tagName: "link",
                        attributes: {href: "baz.css", rel: "stylesheet"},
                    });
                    expect($($("link").get(1))).toBeTag({
                        tagName: "link",
                        attributes: {href: "foo.css", rel: "stylesheet"},
                    });
                    expect($($("link").get(2))).toBeTag({
                        tagName: "link",
                        attributes: {href: "bar.css", rel: "stylesheet"},
                    });
                    expect($($("link").get(3))).toBeTag({
                        tagName: "link",
                        attributes: {href: "baz.css", rel: "stylesheet"},
                    });
                    cleanup(result.outputDir);
                });

                it("should include multiple css files and prepend them in order", async () => {
                    const result = await compile({
                        options: {tags: ["foo.css", "bar.css"], append: false, publicPath: false},
                    });
                    expect(result.error).toBeFalsy();
                    expect(result.errors).toHaveLength(0);
                    const $ = cheerio.load(result.html());
                    expect($("script").length).toBe(2);
                    expect($("link").length).toBe(3);
                    expect($('script[src="style.js"]')).toBeTag({tagName: "script", attributes: {src: "style.js"}});
                    expect($('script[src="app.js"]')).toBeTag({tagName: "script", attributes: {src: "app.js"}});
                    expect($('link[href="style.css"]')).toBeTag({
                        tagName: "link",
                        attributes: {href: "style.css", rel: "stylesheet"},
                    });
                    expect($('link[href="foo.css"]')).toBeTag({
                        tagName: "link",
                        attributes: {href: "foo.css", rel: "stylesheet"},
                    });
                    expect($('link[href="bar.css"]')).toBeTag({
                        tagName: "link",
                        attributes: {href: "bar.css", rel: "stylesheet"},
                    });
                    expect($($("link").get(0))).toBeTag({
                        tagName: "link",
                        attributes: {href: "foo.css", rel: "stylesheet"},
                    });
                    expect($($("link").get(1))).toBeTag({
                        tagName: "link",
                        attributes: {href: "bar.css", rel: "stylesheet"},
                    });
                    cleanup(result.outputDir);
                });
            });

            describe("options.prependExternals", () => {
                it("should auto prepend a script when it has an external and prependExternals is true", async () => {
                    const result = await compile({
                        options: {
                            tags: {path: "foobar.js", external: {packageName: "foobar", variableName: "FooBar"}},
                            append: true,
                            prependExternals: true,
                            publicPath: false,
                        },
                    });
                    expect(result.error).toBeFalsy();
                    expect(result.errors).toHaveLength(0);
                    const $ = cheerio.load(result.html());
                    expect($("script").length).toBe(3);
                    expect($("link").length).toBe(1);
                    expect($('script[src="style.js"]')).toBeTag({tagName: "script", attributes: {src: "style.js"}});
                    expect($('script[src="app.js"]')).toBeTag({tagName: "script", attributes: {src: "app.js"}});
                    expect($('link[href="style.css"]')).toBeTag({
                        tagName: "link",
                        attributes: {href: "style.css", rel: "stylesheet"},
                    });
                    expect($('script[src="foobar.js"]')).toBeTag({tagName: "script", attributes: {src: "foobar.js"}});
                    expect($($("script").get(0))).toBeTag({tagName: "script", attributes: {src: "foobar.js"}});
                    cleanup(result.outputDir);
                });

                it("should not auto prepend a script when it has an external and prependExternals is false", async () => {
                    const result = await compile({
                        options: {
                            tags: {path: "foobar.js", external: {packageName: "foobar", variableName: "FooBar"}},
                            append: true,
                            prependExternals: false,
                            publicPath: false,
                        },
                    });
                    expect(result.error).toBeFalsy();
                    expect(result.errors).toHaveLength(0);
                    const $ = cheerio.load(result.html());
                    expect($("script").length).toBe(3);
                    expect($("link").length).toBe(1);
                    expect($('script[src="style.js"]')).toBeTag({tagName: "script", attributes: {src: "style.js"}});
                    expect($('script[src="app.js"]')).toBeTag({tagName: "script", attributes: {src: "app.js"}});
                    expect($('link[href="style.css"]')).toBeTag({
                        tagName: "link",
                        attributes: {href: "style.css", rel: "stylesheet"},
                    });
                    expect($('script[src="foobar.js"]')).toBeTag({tagName: "script", attributes: {src: "foobar.js"}});
                    expect($($("script").get(2))).toBeTag({tagName: "script", attributes: {src: "foobar.js"}});
                    cleanup(result.outputDir);
                });

                it("should not auto prepend a script that specifies append even when it has an external and prependExternals is false", async () => {
                    const result = await compile({
                        options: {
                            tags: {
                                append: true,
                                path: "foobar.js",
                                external: {packageName: "foobar", variableName: "FooBar"},
                            },
                            append: true,
                            prependExternals: true,
                            publicPath: false,
                        },
                    });
                    expect(result.error).toBeFalsy();
                    expect(result.errors).toHaveLength(0);
                    const $ = cheerio.load(result.html());
                    expect($("script").length).toBe(3);
                    expect($("link").length).toBe(1);
                    expect($('script[src="style.js"]')).toBeTag({tagName: "script", attributes: {src: "style.js"}});
                    expect($('script[src="app.js"]')).toBeTag({tagName: "script", attributes: {src: "app.js"}});
                    expect($('link[href="style.css"]')).toBeTag({
                        tagName: "link",
                        attributes: {href: "style.css", rel: "stylesheet"},
                    });
                    expect($('script[src="foobar.js"]')).toBeTag({tagName: "script", attributes: {src: "foobar.js"}});
                    expect($($("script").get(2))).toBeTag({tagName: "script", attributes: {src: "foobar.js"}});
                    cleanup(result.outputDir);
                });

                it("should auto prepend a script when append is set to false", async () => {
                    const result = await compile({
                        options: {
                            tags: {path: "foobar.js", external: {packageName: "foobar", variableName: "FooBar"}},
                            append: false,
                            prependExternals: true,
                            publicPath: false,
                        },
                    });
                    expect(result.error).toBeFalsy();
                    expect(result.errors).toHaveLength(0);
                    const $ = cheerio.load(result.html());
                    expect($("script").length).toBe(3);
                    expect($("link").length).toBe(1);
                    expect($('script[src="style.js"]')).toBeTag({tagName: "script", attributes: {src: "style.js"}});
                    expect($('script[src="app.js"]')).toBeTag({tagName: "script", attributes: {src: "app.js"}});
                    expect($('link[href="style.css"]')).toBeTag({
                        tagName: "link",
                        attributes: {href: "style.css", rel: "stylesheet"},
                    });
                    expect($('script[src="foobar.js"]')).toBeTag({tagName: "script", attributes: {src: "foobar.js"}});
                    expect($($("script").get(0))).toBeTag({tagName: "script", attributes: {src: "foobar.js"}});
                    cleanup(result.outputDir);
                });

                it("should auto prepend a script when append is not specified", async () => {
                    const result = await compile({
                        options: {
                            tags: {path: "foobar.js", external: {packageName: "foobar", variableName: "FooBar"}},
                            prependExternals: true,
                            publicPath: false,
                        },
                    });
                    expect(result.error).toBeFalsy();
                    expect(result.errors).toHaveLength(0);
                    const $ = cheerio.load(result.html());
                    expect($("script").length).toBe(3);
                    expect($("link").length).toBe(1);
                    expect($('script[src="style.js"]')).toBeTag({tagName: "script", attributes: {src: "style.js"}});
                    expect($('script[src="app.js"]')).toBeTag({tagName: "script", attributes: {src: "app.js"}});
                    expect($('link[href="style.css"]')).toBeTag({
                        tagName: "link",
                        attributes: {href: "style.css", rel: "stylesheet"},
                    });
                    expect($('script[src="foobar.js"]')).toBeTag({tagName: "script", attributes: {src: "foobar.js"}});
                    expect($($("script").get(0))).toBeTag({tagName: "script", attributes: {src: "foobar.js"}});
                    cleanup(result.outputDir);
                });
            });

            describe("options.files", () => {
                it("should not include if not present in defined files", async () => {
                    const result = await compile({
                        options: {files: ["fail.html"], tags: "foobar.js", append: true, publicPath: false},
                    });
                    expect(result.error).toBeFalsy();
                    expect(result.errors).toHaveLength(0);
                    const $ = cheerio.load(result.html());
                    expect($("script").length).toBe(2);
                    expect($("link").length).toBe(1);
                    expect($('script[src="style.js"]')).toBeTag({tagName: "script", attributes: {src: "style.js"}});
                    expect($('script[src="app.js"]')).toBeTag({tagName: "script", attributes: {src: "app.js"}});
                    expect($('link[href="style.css"]')).toBeTag({
                        tagName: "link",
                        attributes: {href: "style.css", rel: "stylesheet"},
                    });
                    cleanup(result.outputDir);
                });

                it("should include if present in defined files", async () => {
                    const result = await compile({
                        options: {files: ["*.html"], tags: "foobar.js", append: true, publicPath: false},
                    });
                    expect(result.error).toBeFalsy();
                    expect(result.errors).toHaveLength(0);
                    const $ = cheerio.load(result.html());
                    expect($("script").length).toBe(3);
                    expect($("link").length).toBe(1);
                    expect($('script[src="style.js"]')).toBeTag({tagName: "script", attributes: {src: "style.js"}});
                    expect($('script[src="app.js"]')).toBeTag({tagName: "script", attributes: {src: "app.js"}});
                    expect($('link[href="style.css"]')).toBeTag({
                        tagName: "link",
                        attributes: {href: "style.css", rel: "stylesheet"},
                    });
                    expect($('script[src="foobar.js"]')).toBeTag({tagName: "script", attributes: {src: "foobar.js"}});
                    expect($($("script").get(2))).toBeTag({tagName: "script", attributes: {src: "foobar.js"}});
                    cleanup(result.outputDir);
                });
            });

            describe("options.jsExtensions", () => {
                it("should include all js type files when multiple jsExtensions are specified", async () => {
                    const result = await compile({
                        options: {tags: ["foo.js", "foo.jsx"], append: true, jsExtensions: [".js", ".jsx"]},
                    });
                    expect(result.error).toBeFalsy();
                    expect(result.errors).toHaveLength(0);
                    const $ = cheerio.load(result.html());
                    expect($("script").length).toBe(4);
                    expect($("link").length).toBe(1);
                    expect($('script[src="style.js"]')).toBeTag({tagName: "script", attributes: {src: "style.js"}});
                    expect($('script[src="app.js"]')).toBeTag({tagName: "script", attributes: {src: "app.js"}});
                    expect($('link[href="style.css"]')).toBeTag({
                        tagName: "link",
                        attributes: {href: "style.css", rel: "stylesheet"},
                    });
                    expect($('script[src="foo.js"]')).toBeTag({tagName: "script", attributes: {src: "foo.js"}});
                    expect($('script[src="foo.jsx"]')).toBeTag({tagName: "script", attributes: {src: "foo.jsx"}});
                    cleanup(result.outputDir);
                });
            });

            describe("options.cssExtensions", () => {
                it("should include all css type files when multiple cssExtensions are specified", async () => {
                    const result = await compile({
                        options: {tags: ["foo.css", "foo.style"], append: true, cssExtensions: [".css", ".style"]},
                    });
                    expect(result.error).toBeFalsy();
                    expect(result.errors).toHaveLength(0);
                    const $ = cheerio.load(result.html());
                    expect($("script").length).toBe(2);
                    expect($("link").length).toBe(3);
                    expect($('script[src="style.js"]')).toBeTag({tagName: "script", attributes: {src: "style.js"}});
                    expect($('script[src="app.js"]')).toBeTag({tagName: "script", attributes: {src: "app.js"}});
                    expect($('link[href="style.css"]')).toBeTag({
                        tagName: "link",
                        attributes: {href: "style.css", rel: "stylesheet"},
                    });
                    expect($('link[href="foo.css"]')).toBeTag({
                        tagName: "link",
                        attributes: {href: "foo.css", rel: "stylesheet"},
                    });
                    expect($('link[href="foo.style"]')).toBeTag({
                        tagName: "link",
                        attributes: {href: "foo.style", rel: "stylesheet"},
                    });
                    cleanup(result.outputDir);
                });
            });

            describe("options.publicPath", () => {
                it("should prefix the publicPath if the publicPath option is set to true", async () => {
                    const result = await compile({
                        webpackPublicPath: "thepublicpath",
                        options: {tags: "foobar.js", append: false, publicPath: true},
                    });
                    expect(result.error).toBeFalsy();
                    expect(result.errors).toHaveLength(0);
                    const $ = cheerio.load(result.html());
                    expect($("script").length).toBe(3);
                    expect($("link").length).toBe(1);
                    expect($('script[src="thepublicpath/style.js"]')).toBeTag({
                        tagName: "script",
                        attributes: {src: "thepublicpath/style.js"},
                    });
                    expect($('script[src="thepublicpath/app.js"]')).toBeTag({
                        tagName: "script",
                        attributes: {src: "thepublicpath/app.js"},
                    });
                    expect($('link[href="thepublicpath/style.css"]')).toBeTag({
                        tagName: "link",
                        attributes: {href: "thepublicpath/style.css", rel: "stylesheet"},
                    });
                    expect($('script[src="thepublicpath/foobar.js"]')).toBeTag({
                        tagName: "script",
                        attributes: {src: "thepublicpath/foobar.js"},
                    });
                    expect($($("script").get(0))).toBeTag({
                        tagName: "script",
                        attributes: {src: "thepublicpath/foobar.js"},
                    });
                    cleanup(result.outputDir);
                });

                it("should not prefix the publicPath if the publicPath option is set to false", async () => {
                    const result = await compile({
                        webpackPublicPath: "thepublicpath",
                        options: [
                            {tags: "local-with-public-path.js", append: false, publicPath: true},
                            {
                                tags: ["local-without-public-path.js", "http://www.foo.com/foobar.js"],
                                append: false,
                                publicPath: false,
                            },
                        ],
                    });
                    expect(result.error).toBeFalsy();
                    expect(result.errors).toHaveLength(0);
                    const $ = cheerio.load(result.html());
                    expect($("script").length).toBe(5);
                    expect($("link").length).toBe(1);
                    expect($('script[src="thepublicpath/style.js"]')).toBeTag({
                        tagName: "script",
                        attributes: {src: "thepublicpath/style.js"},
                    });
                    expect($('script[src="thepublicpath/app.js"]')).toBeTag({
                        tagName: "script",
                        attributes: {src: "thepublicpath/app.js"},
                    });
                    expect($('link[href="thepublicpath/style.css"]')).toBeTag({
                        tagName: "link",
                        attributes: {href: "thepublicpath/style.css", rel: "stylesheet"},
                    });
                    expect($('script[src="thepublicpath/local-with-public-path.js"]')).toBeTag({
                        tagName: "script",
                        attributes: {src: "thepublicpath/local-with-public-path.js"},
                    });
                    expect($('script[src="local-without-public-path.js"]')).toBeTag({
                        tagName: "script",
                        attributes: {src: "local-without-public-path.js"},
                    });
                    expect($('script[src="http://www.foo.com/foobar.js"]')).toBeTag({
                        tagName: "script",
                        attributes: {src: "http://www.foo.com/foobar.js"},
                    });
                    expect($($("script").get(2))).toBeTag({
                        tagName: "script",
                        attributes: {src: "thepublicpath/local-with-public-path.js"},
                    });
                    expect($($("script").get(0))).toBeTag({
                        tagName: "script",
                        attributes: {src: "local-without-public-path.js"},
                    });
                    expect($($("script").get(1))).toBeTag({
                        tagName: "script",
                        attributes: {src: "http://www.foo.com/foobar.js"},
                    });
                    cleanup(result.outputDir);
                });

                it("should not prefix the publicPath if the publicPath option is set to false and the asset is a protocol-relative path", async () => {
                    const result = await compile({
                        webpackPublicPath: "thepublicpath",
                        options: [
                            {tags: "local-with-public-path.js", append: false, publicPath: true},
                            {tags: "//www.foo.com/foobar.js", append: false, publicPath: false},
                        ],
                    });
                    expect(result.error).toBeFalsy();
                    expect(result.errors).toHaveLength(0);
                    const $ = cheerio.load(result.html());
                    expect($("script").length).toBe(4);
                    expect($("link").length).toBe(1);
                    expect($('script[src="thepublicpath/style.js"]')).toBeTag({
                        tagName: "script",
                        attributes: {src: "thepublicpath/style.js"},
                    });
                    expect($('script[src="thepublicpath/app.js"]')).toBeTag({
                        tagName: "script",
                        attributes: {src: "thepublicpath/app.js"},
                    });
                    expect($('link[href="thepublicpath/style.css"]')).toBeTag({
                        tagName: "link",
                        attributes: {href: "thepublicpath/style.css", rel: "stylesheet"},
                    });
                    expect($('script[src="thepublicpath/local-with-public-path.js"]')).toBeTag({
                        tagName: "script",
                        attributes: {src: "thepublicpath/local-with-public-path.js"},
                    });
                    expect($('script[src="//www.foo.com/foobar.js"]')).toBeTag({
                        tagName: "script",
                        attributes: {src: "//www.foo.com/foobar.js"},
                    });
                    expect($($("script").get(1))).toBeTag({
                        tagName: "script",
                        attributes: {src: "thepublicpath/local-with-public-path.js"},
                    });
                    expect($($("script").get(0))).toBeTag({
                        tagName: "script",
                        attributes: {src: "//www.foo.com/foobar.js"},
                    });
                    cleanup(result.outputDir);
                });

                it("should prefix the value of the publicPath option if the publicPath option is set to a string", async () => {
                    const result = await compile({
                        webpackPublicPath: "thepublicpath",
                        options: {tags: "foobar.js", append: false, publicPath: "abc/"},
                    });
                    expect(result.error).toBeFalsy();
                    expect(result.errors).toHaveLength(0);
                    const $ = cheerio.load(result.html());
                    expect($("script").length).toBe(3);
                    expect($("link").length).toBe(1);
                    expect($('script[src="thepublicpath/style.js"]')).toBeTag({
                        tagName: "script",
                        attributes: {src: "thepublicpath/style.js"},
                    });
                    expect($('script[src="thepublicpath/app.js"]')).toBeTag({
                        tagName: "script",
                        attributes: {src: "thepublicpath/app.js"},
                    });
                    expect($('link[href="thepublicpath/style.css"]')).toBeTag({
                        tagName: "link",
                        attributes: {href: "thepublicpath/style.css", rel: "stylesheet"},
                    });
                    expect($('script[src="abc/foobar.js"]')).toBeTag({
                        tagName: "script",
                        attributes: {src: "abc/foobar.js"},
                    });
                    expect($($("script").get(0))).toBeTag({tagName: "script", attributes: {src: "abc/foobar.js"}});
                    cleanup(result.outputDir);
                });

                it("should prefix the value of the publicPath option if the publicPath option is set to a string starting with http://", async () => {
                    const result = await compile({
                        webpackPublicPath: "thepublicpath",
                        options: {tags: "foobar.js", append: false, publicPath: "http://www.foo.com"},
                    });
                    expect(result.error).toBeFalsy();
                    expect(result.errors).toHaveLength(0);
                    const $ = cheerio.load(result.html());
                    expect($("script").length).toBe(3);
                    expect($("link").length).toBe(1);
                    expect($('script[src="thepublicpath/style.js"]')).toBeTag({
                        tagName: "script",
                        attributes: {src: "thepublicpath/style.js"},
                    });
                    expect($('script[src="thepublicpath/app.js"]')).toBeTag({
                        tagName: "script",
                        attributes: {src: "thepublicpath/app.js"},
                    });
                    expect($('link[href="thepublicpath/style.css"]')).toBeTag({
                        tagName: "link",
                        attributes: {href: "thepublicpath/style.css", rel: "stylesheet"},
                    });
                    expect($('script[src="http://www.foo.com/foobar.js"]')).toBeTag({
                        tagName: "script",
                        attributes: {src: "http://www.foo.com/foobar.js"},
                    });
                    expect($($("script").get(0))).toBeTag({
                        tagName: "script",
                        attributes: {src: "http://www.foo.com/foobar.js"},
                    });
                    cleanup(result.outputDir);
                });
            });

            describe("options.hash", () => {
                it("should not append hash if hash options are not provided", async () => {
                    const result = await compile({
                        webpackPublicPath: "mypublic/",
                        htmlOptions: {hash: true},
                        options: {tags: "foobar.css", append: false, publicPath: true},
                    });
                    expect(result.error).toBeFalsy();
                    expect(result.errors).toHaveLength(0);
                    const $ = cheerio.load(result.html());
                    expect($("script").length).toBe(2);
                    expect($("link").length).toBe(2);
                    // entry assets get the html-plugin hash; injected foobar.css does not.
                    const styleJs = $('script[src^="mypublic/style.js"]').attr("src") ?? "";
                    expect(styleJs.startsWith("mypublic/style.js")).toBe(true);
                    const appJs = $('script[src^="mypublic/app.js"]').attr("src") ?? "";
                    expect(appJs.startsWith("mypublic/app.js")).toBe(true);
                    const styleCss = $('link[href^="mypublic/style.css"]').attr("href") ?? "";
                    expect(styleCss.startsWith("mypublic/style.css")).toBe(true);
                    expect($($('link[href^="mypublic/foobar.css"]')).attr("href")).toBe("mypublic/foobar.css");
                    cleanup(result.outputDir);
                });

                it("should not append hash if hash options are set to false", async () => {
                    const result = await compile({
                        webpackPublicPath: "mypublic/",
                        htmlOptions: {hash: true},
                        options: {tags: "foobar.css", append: false, publicPath: true, hash: false},
                    });
                    expect(result.error).toBeFalsy();
                    expect(result.errors).toHaveLength(0);
                    const $ = cheerio.load(result.html());
                    expect($("script").length).toBe(2);
                    expect($("link").length).toBe(2);
                    const styleJs = $('script[src^="mypublic/style.js"]').attr("src") ?? "";
                    expect(styleJs.startsWith("mypublic/style.js")).toBe(true);
                    const appJs = $('script[src^="mypublic/app.js"]').attr("src") ?? "";
                    expect(appJs.startsWith("mypublic/app.js")).toBe(true);
                    const styleCss = $('link[href^="mypublic/style.css"]').attr("href") ?? "";
                    expect(styleCss.startsWith("mypublic/style.css")).toBe(true);
                    expect($($('link[href^="mypublic/foobar.css"]')).attr("href")).toBe("mypublic/foobar.css");
                    cleanup(result.outputDir);
                });

                it("should append hash if hash options are set to true", async () => {
                    const result = await compile({
                        webpackPublicPath: "mypublic/",
                        htmlOptions: {hash: true},
                        options: {tags: "foobar.css", append: false, publicPath: true, hash: true},
                    });
                    expect(result.error).toBeFalsy();
                    expect(result.errors).toHaveLength(0);
                    const $ = cheerio.load(result.html());
                    expect($("script").length).toBe(2);
                    expect($("link").length).toBe(2);
                    // injected foobar.css must carry the SAME query hash as the entry assets.
                    const styleCss = $('link[href^="mypublic/style.css"]').attr("href") ?? "";
                    const hashSuffix = styleCss.slice("mypublic/style.css".length); // "" or "?<hash>"
                    expect(hashSuffix.startsWith("?")).toBe(true);
                    const styleJs = $('script[src^="mypublic/style.js"]').attr("src") ?? "";
                    expect(styleJs).toBe("mypublic/style.js" + hashSuffix);
                    const appJs = $('script[src^="mypublic/app.js"]').attr("src") ?? "";
                    expect(appJs).toBe("mypublic/app.js" + hashSuffix);
                    expect($($('link[href^="mypublic/foobar.css"]')).attr("href")).toBe(
                        "mypublic/foobar.css" + hashSuffix
                    );
                    cleanup(result.outputDir);
                });

                it("should append hash if hash option in this plugin set to true but hash options in HtmlWebpackPlugin config are set to false", async () => {
                    const result = await compile({
                        webpackPublicPath: "mypublic/",
                        htmlOptions: {hash: false},
                        options: {tags: "foobar.css", append: false, publicPath: true, hash: true},
                    });
                    expect(result.error).toBeFalsy();
                    expect(result.errors).toHaveLength(0);
                    const $ = cheerio.load(result.html());
                    expect($("script").length).toBe(2);
                    expect($("link").length).toBe(2);
                    // entry assets have NO hash (html plugin hash:false); injected foobar.css DOES (plugin hash:true).
                    expect($('script[src^="mypublic/style.js"]')).toBeTag({
                        tagName: "script",
                        attributes: {src: "mypublic/style.js"},
                    });
                    expect($('script[src^="mypublic/app.js"]')).toBeTag({
                        tagName: "script",
                        attributes: {src: "mypublic/app.js"},
                    });
                    expect($('link[href^="mypublic/style.css"]')).toBeTag({
                        tagName: "link",
                        attributes: {href: "mypublic/style.css", rel: "stylesheet"},
                    });
                    const foobarCss = $($('link[href^="mypublic/foobar.css"]')).attr("href") ?? "";
                    expect(foobarCss.startsWith("mypublic/foobar.css?")).toBe(true);
                    cleanup(result.outputDir);
                });

                it("should not append hash if hash option in this plugin set to false and hash options in HtmlWebpackPlugin config are set to false", async () => {
                    const result = await compile({
                        webpackPublicPath: "mypublic/",
                        htmlOptions: {hash: false},
                        options: {tags: "foobar.css", append: false, publicPath: true, hash: false},
                    });
                    expect(result.error).toBeFalsy();
                    expect(result.errors).toHaveLength(0);
                    const $ = cheerio.load(result.html());
                    expect($("script").length).toBe(2);
                    expect($("link").length).toBe(2);
                    expect($('script[src^="mypublic/style.js"]')).toBeTag({
                        tagName: "script",
                        attributes: {src: "mypublic/style.js"},
                    });
                    expect($('script[src^="mypublic/app.js"]')).toBeTag({
                        tagName: "script",
                        attributes: {src: "mypublic/app.js"},
                    });
                    expect($('link[href^="mypublic/style.css"]')).toBeTag({
                        tagName: "link",
                        attributes: {href: "mypublic/style.css"},
                    });
                    expect($($('link[href^="mypublic/foobar.css"]')).attr("href")).toBe("mypublic/foobar.css");
                    cleanup(result.outputDir);
                });

                it("should replace the hash if a replacer hash function is provided in the plugin options", async () => {
                    const result = await compile({
                        webpackPublicPath: "mypublic/",
                        htmlOptions: {hash: false},
                        options: {
                            tags: "foobar.[hash].css",
                            append: false,
                            publicPath: true,
                            hash: (assetName: string, hash: string) => assetName.replace(/\[hash\]/, hash),
                        },
                    });
                    expect(result.error).toBeFalsy();
                    expect(result.errors).toHaveLength(0);
                    const $ = cheerio.load(result.html());
                    expect($("script").length).toBe(2);
                    expect($("link").length).toBe(2);
                    expect($('script[src^="mypublic/style.js"]')).toBeTag({
                        tagName: "script",
                        attributes: {src: "mypublic/style.js"},
                    });
                    expect($('script[src^="mypublic/app.js"]')).toBeTag({
                        tagName: "script",
                        attributes: {src: "mypublic/app.js"},
                    });
                    expect($('link[href^="mypublic/style.css"]')).toBeTag({
                        tagName: "link",
                        attributes: {href: "mypublic/style.css", rel: "stylesheet"},
                    });
                    // foobar.[hash].css → foobar.<realHash>.css (no literal "[hash]" remaining)
                    const foobar = $('link[href^="mypublic/foobar."]').attr("href") ?? "";
                    expect(foobar).toMatch(/^mypublic\/foobar\..+\.css$/);
                    expect(foobar).not.toContain("[hash]");
                    cleanup(result.outputDir);
                });

                it("should inject the hash if an injector hash function is provided in the plugin options", async () => {
                    const result = await compile({
                        webpackPublicPath: "mypublic/",
                        copyOptions: [{from: "test/fixtures/g*", to: "assets/[name][ext]"}],
                        options: {
                            tags: [
                                {path: "assets/", globPath: "test/fixtures/", glob: "g*-a.js"},
                                {path: "assets/", globPath: "test/fixtures/", glob: "g*-a.css"},
                            ],
                            hash: (assetName: string, hash: string) => {
                                assetName = assetName.replace(/\.js$/, "." + hash + ".js");
                                assetName = assetName.replace(/\.css$/, "." + hash + ".css");
                                return assetName;
                            },
                            append: true,
                        },
                    });
                    expect(result.error).toBeFalsy();
                    expect(result.errors).toHaveLength(0);
                    const $ = cheerio.load(result.html());
                    expect($("script").length).toBe(3);
                    expect($("link").length).toBe(2);
                    expect($('script[src^="mypublic/style.js"]')).toBeTag({
                        tagName: "script",
                        attributes: {src: "mypublic/style.js"},
                    });
                    expect($('script[src^="mypublic/app.js"]')).toBeTag({
                        tagName: "script",
                        attributes: {src: "mypublic/app.js"},
                    });
                    expect($('link[href^="mypublic/style.css"]')).toBeTag({
                        tagName: "link",
                        attributes: {href: "mypublic/style.css", rel: "stylesheet"},
                    });
                    // glob-a.js/css get the hash injected before the extension.
                    const globCss = $('link[href^="mypublic/assets/glob-a."]').attr("href") ?? "";
                    expect(globCss).toMatch(/^mypublic\/assets\/glob-a\..+\.css$/);
                    const globJs = $('script[src^="mypublic/assets/glob-a."]').attr("src") ?? "";
                    expect(globJs).toMatch(/^mypublic\/assets\/glob-a\..+\.js$/);
                    cleanup(result.outputDir);
                });
            });
        });

        // ----- runTestsForOption({ optionName: 'tags', optionTag: 'link' }) -----
        // optionTag === 'link' → optionAttr = 'href', optionType = 'css', ext = '.css'.
        // The isScript externals block is omitted (upstream only ran the link variant).
        describe("options.tags (link variant)", () => {
            const optionName = "tags" as const;
            const optionTag = "link";
            const optionAttr = "href";
            const optionType = "css";
            const ext = ".css";

            describe("options.tags", () => {
                it("should not include tags when an empty array is provided", async () => {
                    const result = await compile({options: {[optionName]: []}});
                    expect(result.error).toBeFalsy();
                    expect(result.errors).toHaveLength(0);
                    const $ = cheerio.load(result.html());
                    expect($("script").length).toBe(2);
                    expect($("link").length).toBe(1);
                    expect($('script[src="style.js"]')).toBeTag({tagName: "script", attributes: {src: "style.js"}});
                    expect($('script[src="app.js"]')).toBeTag({tagName: "script", attributes: {src: "app.js"}});
                    expect($('link[href="style.css"]')).toBeTag({
                        tagName: "link",
                        attributes: {href: "style.css", rel: "stylesheet"},
                    });
                    cleanup(result.outputDir);
                });

                it("should not include tags when nothing is provided", async () => {
                    const result = await compile({options: {}});
                    expect(result.error).toBeFalsy();
                    expect(result.errors).toHaveLength(0);
                    const $ = cheerio.load(result.html());
                    expect($("script").length).toBe(2);
                    expect($("link").length).toBe(1);
                    expect($('script[src="style.js"]')).toBeTag({tagName: "script", attributes: {src: "style.js"}});
                    expect($('script[src="app.js"]')).toBeTag({tagName: "script", attributes: {src: "app.js"}});
                    expect($('link[href="style.css"]')).toBeTag({
                        tagName: "link",
                        attributes: {href: "style.css", rel: "stylesheet"},
                    });
                    cleanup(result.outputDir);
                });
            });

            describe("options.tags and options.append", () => {
                it("should prepend when the tags are all valid and append is set to false", async () => {
                    const result = await compile({
                        options: {
                            append: false,
                            [optionName]: [{path: `the-href${ext}`, attributes: {rel: "the-rel"}}],
                        },
                    });
                    expect(result.error).toBeFalsy();
                    expect(result.errors).toHaveLength(0);
                    const $ = cheerio.load(result.html());
                    expect($("script").length).toBe(2);
                    expect($("link").length).toBe(2);
                    expect($('script[src="app.js"]')).toBeTag({tagName: "script", attributes: {src: "app.js"}});
                    expect($('script[src="style.js"]')).toBeTag({tagName: "script", attributes: {src: "style.js"}});
                    expect($('link[href="style.css"]')).toBeTag({
                        tagName: "link",
                        attributes: {href: "style.css", rel: "stylesheet"},
                    });
                    expect($(`${optionTag}[${optionAttr}="the-href${ext}"]`)).toBeTag({
                        tagName: optionTag,
                        attributes: {[optionAttr]: `the-href${ext}`, rel: "the-rel"},
                    });
                    expect($($(optionTag).get(0))).toBeTag({
                        tagName: optionTag,
                        attributes: {[optionAttr]: `the-href${ext}`, rel: "the-rel"},
                    });
                    cleanup(result.outputDir);
                });

                it("should append when the tags are all valid and append is set to true", async () => {
                    const result = await compile({
                        options: {append: true, [optionName]: [{path: "the-href", type: optionType}]},
                    });
                    expect(result.error).toBeFalsy();
                    expect(result.errors).toHaveLength(0);
                    const $ = cheerio.load(result.html());
                    expect($("script").length).toBe(2);
                    expect($("link").length).toBe(2);
                    expect($('script[src="app.js"]')).toBeTag({tagName: "script", attributes: {src: "app.js"}});
                    expect($('script[src="style.js"]')).toBeTag({tagName: "script", attributes: {src: "style.js"}});
                    expect($('link[href="style.css"]')).toBeTag({
                        tagName: "link",
                        attributes: {href: "style.css", rel: "stylesheet"},
                    });
                    expect($(`${optionTag}[${optionAttr}="the-href"]`)).toBeTag({
                        tagName: optionTag,
                        attributes: {[optionAttr]: "the-href"},
                    });
                    expect($($(optionTag).get(1))).toBeTag({
                        tagName: optionTag,
                        attributes: {[optionAttr]: "the-href"},
                    });
                    cleanup(result.outputDir);
                });
            });

            describe("options.tags attributes", () => {
                it("should add the given tags attributes to the matching tag", async () => {
                    const result = await compile({
                        options: {
                            append: false,
                            [optionName]: [
                                {path: `assets/abc${ext}`, attributes: {id: "abc"}},
                                {path: `assets/def${ext}`, attributes: {id: "def", media: "screen"}},
                                {path: `assets/ghi${ext}`},
                            ],
                        },
                    });
                    expect(result.error).toBeFalsy();
                    expect(result.errors).toHaveLength(0);
                    const $ = cheerio.load(result.html());
                    expect($("script").length).toBe(2);
                    expect($("link").length).toBe(4);
                    expect($('script[src="app.js"]')).toBeTag({tagName: "script", attributes: {src: "app.js"}});
                    expect($('script[src="style.js"]')).toBeTag({tagName: "script", attributes: {src: "style.js"}});
                    expect($('link[href="style.css"]')).toBeTag({
                        tagName: "link",
                        attributes: {href: "style.css", rel: "stylesheet"},
                    });
                    expect($(`${optionTag}[${optionAttr}="assets/abc${ext}"]`)).toBeTag({
                        tagName: optionTag,
                        attributes: {[optionAttr]: `assets/abc${ext}`, id: "abc"},
                    });
                    expect($(`${optionTag}[${optionAttr}="assets/def${ext}"]`)).toBeTag({
                        tagName: optionTag,
                        attributes: {[optionAttr]: `assets/def${ext}`, id: "def", media: "screen"},
                    });
                    expect($(`${optionTag}[${optionAttr}="assets/ghi${ext}"]`)).toBeTag({
                        tagName: optionTag,
                        attributes: {[optionAttr]: `assets/ghi${ext}`},
                    });
                    cleanup(result.outputDir);
                });

                it("can match tags with an tags overridden publicPath and set hash", async () => {
                    const result = await compile({
                        webpackPublicPath: "thepublicpath/",
                        htmlOptions: {hash: true},
                        options: {
                            [optionName]: [
                                {path: `assets/abc${ext}`, attributes: {id: "abc"}},
                                {path: `assets/def${ext}`, attributes: {id: "def", media: "screen"}},
                                {path: `assets/ghi${ext}`},
                            ],
                            append: false,
                            hash: true,
                        },
                    });
                    expect(result.error).toBeFalsy();
                    expect(result.errors).toHaveLength(0);
                    const $ = cheerio.load(result.html());
                    expect($("script").length).toBe(2);
                    expect($("link").length).toBe(4);
                    // discover the real hash suffix from an entry asset, then assert injected tags share it.
                    const styleCss = $('link[href^="thepublicpath/style.css"]').attr("href") ?? "";
                    const hashSuffix = styleCss.slice("thepublicpath/style.css".length);
                    expect(hashSuffix.startsWith("?")).toBe(true);
                    expect($('script[src^="thepublicpath/app.js"]').attr("src")).toBe(
                        "thepublicpath/app.js" + hashSuffix
                    );
                    expect($('script[src^="thepublicpath/style.js"]').attr("src")).toBe(
                        "thepublicpath/style.js" + hashSuffix
                    );
                    expect($(`${optionTag}[${optionAttr}^="thepublicpath/assets/abc${ext}"]`)).toBeTag({
                        tagName: optionTag,
                        attributes: {[optionAttr]: `thepublicpath/assets/abc${ext}` + hashSuffix, id: "abc"},
                    });
                    expect($(`${optionTag}[${optionAttr}^="thepublicpath/assets/def${ext}"]`)).toBeTag({
                        tagName: optionTag,
                        attributes: {
                            [optionAttr]: `thepublicpath/assets/def${ext}` + hashSuffix,
                            id: "def",
                            media: "screen",
                        },
                    });
                    expect($(`${optionTag}[${optionAttr}^="thepublicpath/assets/ghi${ext}"]`)).toBeTag({
                        tagName: optionTag,
                        attributes: {[optionAttr]: `thepublicpath/assets/ghi${ext}` + hashSuffix},
                    });
                    cleanup(result.outputDir);
                });

                it("should output tags attributes other than path", async () => {
                    const result = await compile({
                        options: {
                            append: false,
                            [optionName]: [{path: "/the-href.css", attributes: {rel: "the-rel", a: "abc", x: "xyz"}}],
                        },
                    });
                    expect(result.error).toBeFalsy();
                    expect(result.errors).toHaveLength(0);
                    const $ = cheerio.load(result.html());
                    expect($("script").length).toBe(2);
                    expect($("link").length).toBe(2);
                    expect($('script[src="app.js"]')).toBeTag({tagName: "script", attributes: {src: "app.js"}});
                    expect($('script[src="style.js"]')).toBeTag({tagName: "script", attributes: {src: "style.js"}});
                    expect($('link[href="style.css"]')).toBeTag({
                        tagName: "link",
                        attributes: {href: "style.css", rel: "stylesheet"},
                    });
                    expect($('link[href="/the-href.css"]')).toBeTag({
                        tagName: "link",
                        attributes: {href: "/the-href.css", rel: "the-rel", a: "abc", x: "xyz"},
                    });
                    cleanup(result.outputDir);
                });

                it("should output tags attributes other than path that are booleans", async () => {
                    const result = await compile({
                        options: {
                            append: false,
                            [optionName]: [
                                {path: "/the-href.css", attributes: {aboolean: true, anotherboolean: false}},
                            ],
                        },
                    });
                    expect(result.error).toBeFalsy();
                    expect(result.errors).toHaveLength(0);
                    const $ = cheerio.load(result.html());
                    expect($("script").length).toBe(2);
                    expect($("link").length).toBe(2);
                    expect($('script[src="app.js"]')).toBeTag({tagName: "script", attributes: {src: "app.js"}});
                    expect($('script[src="style.js"]')).toBeTag({tagName: "script", attributes: {src: "style.js"}});
                    expect($('link[href="style.css"]')).toBeTag({
                        tagName: "link",
                        attributes: {href: "style.css", rel: "stylesheet"},
                    });
                    expect($('link[href="/the-href.css"]')).toBeTag({
                        tagName: "link",
                        attributes: {href: "/the-href.css", aboolean: "", anotherboolean: undefined},
                    });
                    cleanup(result.outputDir);
                });

                it("should output tags attributes other than path that are numbers", async () => {
                    const result = await compile({
                        options: {
                            append: false,
                            [optionName]: [{path: "/the-href.css", attributes: {anumber: 123, anothernumber: -456}}],
                        },
                    });
                    expect(result.error).toBeFalsy();
                    expect(result.errors).toHaveLength(0);
                    const $ = cheerio.load(result.html());
                    expect($("script").length).toBe(2);
                    expect($("link").length).toBe(2);
                    expect($('script[src="app.js"]')).toBeTag({tagName: "script", attributes: {src: "app.js"}});
                    expect($('script[src="style.js"]')).toBeTag({tagName: "script", attributes: {src: "style.js"}});
                    expect($('link[href="style.css"]')).toBeTag({
                        tagName: "link",
                        attributes: {href: "style.css", rel: "stylesheet"},
                    });
                    expect($('link[href="/the-href.css"]')).toBeTag({
                        tagName: "link",
                        attributes: {href: "/the-href.css", anumber: "123", anothernumber: "-456"},
                    });
                    cleanup(result.outputDir);
                });

                it("should output tags attributes and inject the publicPath only when tags object publicPath is not false", async () => {
                    const publicPath = "/pub-path/";
                    const result = await compile({
                        webpackPublicPath: publicPath,
                        options: {
                            append: false,
                            [optionName]: [
                                {
                                    path: `/the-href${ext}`,
                                    publicPath: false,
                                    attributes: {rel: "the-rel-a", a: "abc", x: "xyz"},
                                },
                                {
                                    path: `the-href-1${ext}`,
                                    publicPath: true,
                                    attributes: {rel: "the-rel-b", a: "123", x: "789"},
                                },
                                {path: `the-href-2${ext}`, attributes: {rel: "the-rel-c", a: "___", x: "---"}},
                            ],
                        },
                    });
                    expect(result.error).toBeFalsy();
                    expect(result.errors).toHaveLength(0);
                    const $ = cheerio.load(result.html());
                    expect($("script").length).toBe(2);
                    expect($("link").length).toBe(4);
                    expect($('script[src="' + publicPath + 'app.js"]')).toBeTag({
                        tagName: "script",
                        attributes: {src: publicPath + "app.js"},
                    });
                    expect($('script[src="' + publicPath + 'style.js"]')).toBeTag({
                        tagName: "script",
                        attributes: {src: publicPath + "style.js"},
                    });
                    expect($('link[href="' + publicPath + 'style.css"]')).toBeTag({
                        tagName: "link",
                        attributes: {href: publicPath + "style.css", rel: "stylesheet"},
                    });
                    expect($(`link[href="/the-href${ext}"]`)).toBeTag({
                        tagName: "link",
                        attributes: {href: `/the-href${ext}`, rel: "the-rel-a", a: "abc", x: "xyz"},
                    });
                    expect($(`link[href="${publicPath}the-href-1${ext}"]`)).toBeTag({
                        tagName: "link",
                        attributes: {href: `${publicPath}the-href-1${ext}`, rel: "the-rel-b", a: "123", x: "789"},
                    });
                    expect($(`link[href="${publicPath}the-href-2${ext}"]`)).toBeTag({
                        tagName: "link",
                        attributes: {href: `${publicPath}the-href-2${ext}`, rel: "the-rel-c", a: "___", x: "---"},
                    });
                    cleanup(result.outputDir);
                });
            });

            describe("options.tags glob", () => {
                it("should include any files for a tags glob that does match files", async () => {
                    const result = await compile({
                        copyOptions: [{from: "test/fixtures/g*", to: "assets/[name][ext]"}],
                        options: {
                            [optionName]: [
                                {path: "assets/", globPath: "test/fixtures/", glob: `glob-a*${ext}`},
                                {path: "assets/", globPath: "test/fixtures/", glob: `glob-b*${ext}`},
                            ],
                            append: true,
                        },
                    });
                    expect(result.error).toBeFalsy();
                    expect(result.errors).toHaveLength(0);
                    const $ = cheerio.load(result.html());
                    expect($("script").length).toBe(2);
                    expect($("link").length).toBe(3);
                    expect($('script[src="style.js"]')).toBeTag({tagName: "script", attributes: {src: "style.js"}});
                    expect($('script[src="app.js"]')).toBeTag({tagName: "script", attributes: {src: "app.js"}});
                    expect($('link[href="style.css"]')).toBeTag({
                        tagName: "link",
                        attributes: {href: "style.css", rel: "stylesheet"},
                    });
                    expect($(`${optionTag}[${optionAttr}="assets/glob-a${ext}"]`)).toBeTag({
                        tagName: optionTag,
                        attributes: {[optionAttr]: `assets/glob-a${ext}`},
                    });
                    expect($(`${optionTag}[${optionAttr}="assets/glob-b${ext}"]`)).toBeTag({
                        tagName: optionTag,
                        attributes: {[optionAttr]: `assets/glob-b${ext}`},
                    });
                    cleanup(result.outputDir);
                });

                it("should include any files for a tags glob that does match files and has globFlatten false", async () => {
                    const result = await compile({
                        copyOptions: [{from: "test/fixtures/a-dir/*", to: "assets/a-dir"}],
                        options: {
                            [optionName]: [
                                {
                                    path: "assets/",
                                    globPath: "test/fixtures/",
                                    glob: `**/file-a*${ext}`,
                                    globFlatten: false,
                                },
                                {
                                    path: "assets/",
                                    globPath: "test/fixtures/",
                                    glob: `**/file-b*${ext}`,
                                    globFlatten: false,
                                },
                            ],
                            append: true,
                        },
                    });
                    expect(result.error).toBeFalsy();
                    expect(result.errors).toHaveLength(0);
                    const $ = cheerio.load(result.html());
                    expect($("script").length).toBe(2);
                    expect($("link").length).toBe(3);
                    expect($('script[src="style.js"]')).toBeTag({tagName: "script", attributes: {src: "style.js"}});
                    expect($('script[src="app.js"]')).toBeTag({tagName: "script", attributes: {src: "app.js"}});
                    expect($('link[href="style.css"]')).toBeTag({
                        tagName: "link",
                        attributes: {href: "style.css", rel: "stylesheet"},
                    });
                    expect($(`${optionTag}[${optionAttr}="assets/a-dir/file-a${ext}"]`)).toBeTag({
                        tagName: optionTag,
                        attributes: {[optionAttr]: `assets/a-dir/file-a${ext}`},
                    });
                    expect($(`${optionTag}[${optionAttr}="assets/a-dir/file-b${ext}"]`)).toBeTag({
                        tagName: optionTag,
                        attributes: {[optionAttr]: `assets/a-dir/file-b${ext}`},
                    });
                    cleanup(result.outputDir);
                });

                it("should include any files for a tags glob that does match files and has globFlatten true", async () => {
                    const result = await compile({
                        copyOptions: [{from: "test/fixtures/a-dir/*", to: "assets/[name][ext]"}],
                        options: {
                            [optionName]: [
                                {
                                    path: "assets/",
                                    globPath: "test/fixtures/",
                                    glob: `**/file-a*${ext}`,
                                    globFlatten: true,
                                },
                                {
                                    path: "assets/",
                                    globPath: "test/fixtures/",
                                    glob: `**/file-b*${ext}`,
                                    globFlatten: true,
                                },
                            ],
                            append: true,
                        },
                    });
                    expect(result.error).toBeFalsy();
                    expect(result.errors).toHaveLength(0);
                    const $ = cheerio.load(result.html());
                    expect($("script").length).toBe(2);
                    expect($("link").length).toBe(3);
                    expect($('script[src="style.js"]')).toBeTag({tagName: "script", attributes: {src: "style.js"}});
                    expect($('script[src="app.js"]')).toBeTag({tagName: "script", attributes: {src: "app.js"}});
                    expect($('link[href="style.css"]')).toBeTag({
                        tagName: "link",
                        attributes: {href: "style.css", rel: "stylesheet"},
                    });
                    expect($(`${optionTag}[${optionAttr}="assets/file-a${ext}"]`)).toBeTag({
                        tagName: optionTag,
                        attributes: {[optionAttr]: `assets/file-a${ext}`},
                    });
                    expect($(`${optionTag}[${optionAttr}="assets/file-b${ext}"]`)).toBeTag({
                        tagName: optionTag,
                        attributes: {[optionAttr]: `assets/file-b${ext}`},
                    });
                    cleanup(result.outputDir);
                });
            });

            describe("options.tags sourcePath", () => {
                it("should not throw an error when the tags sourcePath points to a valid js file", async () => {
                    const result = await compile({
                        options: {[optionName]: {path: `foobar${ext}`, sourcePath: path.join(FIXTURES_PATH, "other")}},
                    });
                    expect(result.error).toBeFalsy();
                    expect(result.errors).toHaveLength(0);
                    const $ = cheerio.load(result.html());
                    expect($("script").length).toBe(2);
                    expect($("link").length).toBe(2);
                    expect($('script[src="style.js"]')).toBeTag({tagName: "script", attributes: {src: "style.js"}});
                    expect($('script[src="app.js"]')).toBeTag({tagName: "script", attributes: {src: "app.js"}});
                    expect($('link[href="style.css"]')).toBeTag({
                        tagName: "link",
                        attributes: {href: "style.css", rel: "stylesheet"},
                    });
                    expect($(`${optionTag}[${optionAttr}="foobar${ext}"]`)).toBeTag({
                        tagName: optionTag,
                        attributes: {[optionAttr]: `foobar${ext}`},
                    });
                    expect($($(optionTag).get(1))).toBeTag({
                        tagName: optionTag,
                        attributes: {[optionAttr]: `foobar${ext}`},
                    });
                    cleanup(result.outputDir);
                });

                it("should throw an error when the tags sourcePath does not point to a valid js file", async () => {
                    const badFilename = "does-not-exist.js";
                    const result = await compile({
                        options: {[optionName]: {path: "foobar.js", sourcePath: path.join(FIXTURES_PATH, badFilename)}},
                    });
                    expect(result.error).toBeFalsy();
                    expect(result.errors.length).toBeGreaterThan(0);
                    expect(hasErrorText(result, ["no such file", "could not load file"])).toBe(true);
                    expect(hasErrorText(result, badFilename)).toBe(true);
                    cleanup(result.outputDir);
                });

                it("should not throw an error when tags sourcePath is used and the css file exists", async () => {
                    const result = await compile({
                        options: {
                            [optionName]: [{path: `assets/afile${ext}`, sourcePath: "test/fixtures/other"}],
                            append: false,
                        },
                    });
                    expect(result.error).toBeFalsy();
                    expect(result.errors).toHaveLength(0);
                    const $ = cheerio.load(result.html());
                    expect($("script").length).toBe(2);
                    expect($("link").length).toBe(2);
                    expect($('script[src="app.js"]')).toBeTag({tagName: "script", attributes: {src: "app.js"}});
                    expect($('script[src="style.js"]')).toBeTag({tagName: "script", attributes: {src: "style.js"}});
                    expect($('link[href="style.css"]')).toBeTag({
                        tagName: "link",
                        attributes: {href: "style.css", rel: "stylesheet"},
                    });
                    expect($(`${optionTag}[${optionAttr}="assets/afile${ext}"]`)).toBeTag({
                        tagName: optionTag,
                        attributes: {[optionAttr]: `assets/afile${ext}`},
                    });
                    cleanup(result.outputDir);
                });

                it("should throw an error when tags sourcePath is used and the css file does not exist", async () => {
                    const result = await compile({
                        options: {
                            [optionName]: [{path: "assets/astyle.css", sourcePath: "test/fixtures/anotherstyle.css"}],
                            append: false,
                        },
                    });
                    expect(result.error).toBeFalsy();
                    expect(result.errors.length).toBeGreaterThan(0);
                    cleanup(result.outputDir);
                });
            });
        });

        describe("options.tags (mixed types)", () => {
            it("should include a mixture of js and css files", async () => {
                const result = await compile({
                    options: {
                        tags: [
                            "foo.js",
                            "foo.css",
                            {path: "baz", type: "css"},
                            {path: "bar.js"},
                            "bar.css",
                            {path: "qux", type: "js"},
                        ],
                        append: true,
                        publicPath: false,
                    },
                });
                expect(result.error).toBeFalsy();
                expect(result.errors).toHaveLength(0);
                const $ = cheerio.load(result.html());
                expect($("script").length).toBe(5);
                expect($("link").length).toBe(4);
                expect($('script[src="style.js"]')).toBeTag({tagName: "script", attributes: {src: "style.js"}});
                expect($('script[src="app.js"]')).toBeTag({tagName: "script", attributes: {src: "app.js"}});
                expect($('link[href="style.css"]')).toBeTag({
                    tagName: "link",
                    attributes: {href: "style.css", rel: "stylesheet"},
                });
                expect($('script[src="foo.js"]')).toBeTag({tagName: "script", attributes: {src: "foo.js"}});
                expect($('script[src="bar.js"]')).toBeTag({tagName: "script", attributes: {src: "bar.js"}});
                expect($('script[src="qux"]')).toBeTag({tagName: "script", attributes: {src: "qux"}});
                expect($('link[href="foo.css"]')).toBeTag({
                    tagName: "link",
                    attributes: {href: "foo.css", rel: "stylesheet"},
                });
                expect($('link[href="bar.css"]')).toBeTag({
                    tagName: "link",
                    attributes: {href: "bar.css", rel: "stylesheet"},
                });
                expect($('link[href="baz"]')).toBeTag({tagName: "link", attributes: {href: "baz", rel: "stylesheet"}});
                cleanup(result.outputDir);
            });
        });

        describe("options.metas", () => {
            it("should output meta tags when the meta has no path", async () => {
                const result = await compile({
                    htmlOptions: {template: INDEX_HTML, inject: true},
                    options: {metas: {attributes: {a: "some string", b: 234}}},
                });
                expect(result.error).toBeFalsy();
                expect(result.errors).toHaveLength(0);
                const $ = cheerio.load(result.html());
                expect($("script").length).toBe(3);
                expect($("link").length).toBe(1);
                expect($("meta").length).toBe(4);
                expect($('script[src="style.js"]')).toBeTag({tagName: "script", attributes: {src: "style.js"}});
                expect($('script[src="app.js"]')).toBeTag({tagName: "script", attributes: {src: "app.js"}});
                expect($('link[href="style.css"]')).toBeTag({
                    tagName: "link",
                    attributes: {href: "style.css", rel: "stylesheet"},
                });
                expect($('meta[a="some string"]')).toBeTag({tagName: "meta", attributes: {a: "some string", b: "234"}});
                cleanup(result.outputDir);
            });

            it("should output meta tags and set the content attribute to the path", async () => {
                const result = await compile({
                    htmlOptions: {template: INDEX_HTML, inject: true},
                    options: {metas: {path: "meta-path", attributes: {a: "some string", b: 234}}},
                });
                expect(result.error).toBeFalsy();
                expect(result.errors).toHaveLength(0);
                const $ = cheerio.load(result.html());
                expect($("script").length).toBe(3);
                expect($("link").length).toBe(1);
                expect($("meta").length).toBe(4);
                expect($('script[src="style.js"]')).toBeTag({tagName: "script", attributes: {src: "style.js"}});
                expect($('script[src="app.js"]')).toBeTag({tagName: "script", attributes: {src: "app.js"}});
                expect($('link[href="style.css"]')).toBeTag({
                    tagName: "link",
                    attributes: {href: "style.css", rel: "stylesheet"},
                });
                expect($('meta[content="meta-path"]')).toBeTag({
                    tagName: "meta",
                    attributes: {content: "meta-path", a: "some string", b: "234"},
                });
                cleanup(result.outputDir);
            });

            it("should output meta tags and set the content attribute to the path with publicPath", async () => {
                const result = await compile({
                    htmlOptions: {template: INDEX_HTML, inject: true},
                    options: {
                        publicPath: "/publicpath/",
                        metas: {path: "meta-path", attributes: {a: "some string", b: 234}},
                    },
                });
                expect(result.error).toBeFalsy();
                expect(result.errors).toHaveLength(0);
                const $ = cheerio.load(result.html());
                expect($("script").length).toBe(3);
                expect($("link").length).toBe(1);
                expect($("meta").length).toBe(4);
                expect($('script[src="style.js"]')).toBeTag({tagName: "script", attributes: {src: "style.js"}});
                expect($('script[src="app.js"]')).toBeTag({tagName: "script", attributes: {src: "app.js"}});
                expect($('link[href="style.css"]')).toBeTag({
                    tagName: "link",
                    attributes: {href: "style.css", rel: "stylesheet"},
                });
                expect($('meta[content="/publicpath/meta-path"]')).toBeTag({
                    tagName: "meta",
                    attributes: {content: "/publicpath/meta-path", a: "some string", b: "234"},
                });
                cleanup(result.outputDir);
            });

            it("should output meta tags and set the content attribute to the path with hash", async () => {
                const result = await compile({
                    htmlOptions: {template: INDEX_HTML, inject: true},
                    options: {hash: true, metas: {path: "meta-path", attributes: {a: "some string", b: 234}}},
                });
                expect(result.error).toBeFalsy();
                expect(result.errors).toHaveLength(0);
                const $ = cheerio.load(result.html());
                expect($("script").length).toBe(3);
                expect($("link").length).toBe(1);
                expect($("meta").length).toBe(4);
                expect($('script[src="style.js"]')).toBeTag({tagName: "script", attributes: {src: "style.js"}});
                expect($('script[src="app.js"]')).toBeTag({tagName: "script", attributes: {src: "app.js"}});
                expect($('link[href="style.css"]')).toBeTag({
                    tagName: "link",
                    attributes: {href: "style.css", rel: "stylesheet"},
                });
                // meta content carries the compilation hash query.
                const content = $('meta[content^="meta-path"]').attr("content") ?? "";
                expect(content.startsWith("meta-path?")).toBe(true);
                expect($('meta[content^="meta-path"]')).toBeTag({
                    tagName: "meta",
                    attributes: {content, a: "some string", b: "234"},
                });
                cleanup(result.outputDir);
            });

            it("should output multiple meta tags and set the content attribute to the path with publicPath or hash", async () => {
                const result = await compile({
                    htmlOptions: {template: INDEX_HTML, inject: true},
                    options: {
                        hash: false,
                        publicPath: false,
                        metas: [
                            {
                                path: "meta-path-a",
                                publicPath: "/thepublicpath/",
                                attributes: {a: "some string a", b: 123},
                            },
                            {path: "meta-path-b", hash: true, attributes: {a: "some string b", b: 456}},
                        ],
                    },
                });
                expect(result.error).toBeFalsy();
                expect(result.errors).toHaveLength(0);
                const $ = cheerio.load(result.html());
                expect($("script").length).toBe(3);
                expect($("link").length).toBe(1);
                expect($("meta").length).toBe(5);
                expect($('script[src="style.js"]')).toBeTag({tagName: "script", attributes: {src: "style.js"}});
                expect($('script[src="app.js"]')).toBeTag({tagName: "script", attributes: {src: "app.js"}});
                expect($('link[href="style.css"]')).toBeTag({
                    tagName: "link",
                    attributes: {href: "style.css", rel: "stylesheet"},
                });
                expect($('meta[content^="/thepublicpath/meta-path-a"]')).toBeTag({
                    tagName: "meta",
                    attributes: {content: "/thepublicpath/meta-path-a", a: "some string a", b: "123"},
                });
                const contentB = $('meta[content^="meta-path-b"]').attr("content") ?? "";
                expect(contentB.startsWith("meta-path-b?")).toBe(true);
                expect($('meta[content^="meta-path-b"]')).toBeTag({
                    tagName: "meta",
                    attributes: {content: contentB, a: "some string b", b: "456"},
                });
                cleanup(result.outputDir);
            });
        });

        describe("multiple plugins", () => {
            it("should output all files when multiple plugins are used with varying append", async () => {
                const result = await compile({
                    options: [
                        {tags: ["foo.js", "foo.css"], append: true, publicPath: false},
                        {links: "bar.css", append: false, publicPath: false},
                        {links: {path: "bar2.css"}, scripts: "bar.js", append: true, publicPath: false},
                        {links: "car.css", append: true, publicPath: false},
                        {scripts: "car.js", append: false, publicPath: false},
                    ],
                });
                expect(result.error).toBeFalsy();
                expect(result.errors).toHaveLength(0);
                const $ = cheerio.load(result.html());
                const scripts = $("script");
                const links = $("link");

                expect(scripts.length).toBe(5);
                expect(scripts.get(0)).toBeTag({tagName: "script", attributes: {src: "car.js"}});
                expect(scripts.get(1)).toBeTag({tagName: "script", attributes: {src: "app.js"}});
                expect(scripts.get(2)).toBeTag({tagName: "script", attributes: {src: "style.js"}});
                expect(scripts.get(3)).toBeTag({tagName: "script", attributes: {src: "foo.js"}});
                expect(scripts.get(4)).toBeTag({tagName: "script", attributes: {src: "bar.js"}});

                expect(links.length).toBe(5);
                expect(links.get(0)).toBeTag({tagName: "link", attributes: {href: "bar.css", rel: "stylesheet"}});
                expect(links.get(1)).toBeTag({tagName: "link", attributes: {href: "style.css", rel: "stylesheet"}});
                expect(links.get(2)).toBeTag({tagName: "link", attributes: {href: "foo.css", rel: "stylesheet"}});
                expect(links.get(3)).toBeTag({tagName: "link", attributes: {href: "bar2.css", rel: "stylesheet"}});
                expect(links.get(4)).toBeTag({tagName: "link", attributes: {href: "car.css", rel: "stylesheet"}});
                cleanup(result.outputDir);
            });
        });

        describe("options.links & options.tags", () => {
            it("should prepend links and tags together with a custom index.html template when inject is false and append is set to false", async () => {
                const result = await compile({
                    htmlOptions: {template: INDEX_NO_INJECT_HTML, inject: false},
                    options: {
                        tags: [{path: "assets/astyle.css", sourcePath: "test/fixtures/astyle.css"}],
                        append: false,
                        links: [{path: "the-href", attributes: {rel: "the-rel", sizes: "16x16"}}],
                    },
                });
                expect(result.error).toBeFalsy();
                expect(result.errors).toHaveLength(0);
                const $ = cheerio.load(result.html());
                expect($("script").length).toBe(3);
                expect($("link").length).toBe(3);
                expect($('script[src="app.js"]')).toBeTag({tagName: "script", attributes: {src: "app.js"}});
                expect($('script[src="style.js"]')).toBeTag({tagName: "script", attributes: {src: "style.js"}});
                expect($('script[id="loading-script"]').toString()).toContain('<script id="loading-script"');
                expect($('link[href="style.css"]')).toBeTag({tagName: "link", attributes: {href: "style.css"}});
                expect($('link[href="assets/astyle.css"]')).toBeTag({
                    tagName: "link",
                    attributes: {href: "assets/astyle.css"},
                });
                expect($('link[href="the-href"]')).toBeTag({tagName: "link", attributes: {href: "the-href"}});
                cleanup(result.outputDir);
            });

            it("should append links and tags together with a custom index.html template when inject is false and append is set to true", async () => {
                const result = await compile({
                    htmlOptions: {template: INDEX_NO_INJECT_HTML, inject: false},
                    options: {
                        tags: [{path: "assets/astyle.css", sourcePath: "test/fixtures/astyle.css"}],
                        append: true,
                        links: [{path: "the-href", attributes: {rel: "the-rel", sizes: "16x16"}}],
                    },
                });
                expect(result.error).toBeFalsy();
                expect(result.errors).toHaveLength(0);
                const $ = cheerio.load(result.html());
                expect($("script").length).toBe(3);
                expect($("link").length).toBe(3);
                expect($('script[src="app.js"]')).toBeTag({tagName: "script", attributes: {src: "app.js"}});
                expect($('script[src="style.js"]')).toBeTag({tagName: "script", attributes: {src: "style.js"}});
                expect($('script[id="loading-script"]').toString()).toContain('<script id="loading-script"');
                expect($('link[href="style.css"]')).toBeTag({tagName: "link", attributes: {href: "style.css"}});
                expect($('link[href="assets/astyle.css"]')).toBeTag({
                    tagName: "link",
                    attributes: {href: "assets/astyle.css"},
                });
                expect($('link[href="the-href"]')).toBeTag({tagName: "link", attributes: {href: "the-href"}});
                cleanup(result.outputDir);
            });

            it("should append links and tags together with a custom index.html template when inject is false and append is set to true and false", async () => {
                const result = await compile({
                    htmlOptions: {template: INDEX_NO_INJECT_HTML, inject: false},
                    options: [
                        {
                            tags: [{path: "assets/astyle-1.css", sourcePath: "test/fixtures/astyle.css"}],
                            append: true,
                            links: [{path: "the-href-1", attributes: {rel: "the-rel-1", sizes: "16x16"}}],
                        },
                        {
                            tags: [{path: "assets/astyle-2.css", sourcePath: "test/fixtures/astyle.css"}],
                            append: false,
                            links: [{path: "the-href-2", attributes: {rel: "the-rel-2", sizes: "16x16"}}],
                        },
                    ],
                });
                expect(result.error).toBeFalsy();
                expect(result.errors).toHaveLength(0);
                const $ = cheerio.load(result.html());
                expect($("script").length).toBe(3);
                expect($("link").length).toBe(5);
                expect($('script[src="app.js"]')).toBeTag({tagName: "script", attributes: {src: "app.js"}});
                expect($('script[src="style.js"]')).toBeTag({tagName: "script", attributes: {src: "style.js"}});
                expect($('script[id="loading-script"]').toString()).toContain('<script id="loading-script"');
                expect($('link[href="style.css"]')).toBeTag({tagName: "link", attributes: {href: "style.css"}});
                expect($('link[href="assets/astyle-1.css"]')).toBeTag({
                    tagName: "link",
                    attributes: {href: "assets/astyle-1.css"},
                });
                expect($('link[href="the-href-1"]')).toBeTag({tagName: "link", attributes: {href: "the-href-1"}});
                expect($('link[href="assets/astyle-2.css"]')).toBeTag({
                    tagName: "link",
                    attributes: {href: "assets/astyle-2.css"},
                });
                expect($('link[href="the-href-2"]')).toBeTag({tagName: "link", attributes: {href: "the-href-2"}});
                cleanup(result.outputDir);
            });

            it("should append links and tags together with a custom index.html template when inject is true and append is set to true and false", async () => {
                const result = await compile({
                    htmlOptions: {template: INDEX_HTML, inject: true},
                    options: [
                        {
                            tags: [{path: "assets/astyle-1.css", sourcePath: "test/fixtures/astyle.css"}],
                            append: true,
                            links: [{path: "the-href-1", attributes: {rel: "the-rel-1", sizes: "16x16"}}],
                        },
                        {
                            tags: [{path: "assets/astyle-2.css", sourcePath: "test/fixtures/astyle.css"}],
                            append: false,
                            links: [{path: "the-href-2", attributes: {rel: "the-rel-2", sizes: "16x16"}}],
                        },
                    ],
                });
                expect(result.error).toBeFalsy();
                expect(result.errors).toHaveLength(0);
                const $ = cheerio.load(result.html());
                expect($("script").length).toBe(3);
                expect($("link").length).toBe(5);
                expect($('script[src="app.js"]')).toBeTag({tagName: "script", attributes: {src: "app.js"}});
                expect($('script[src="style.js"]')).toBeTag({tagName: "script", attributes: {src: "style.js"}});
                expect($('script[id="loading-script"]').toString()).toContain('<script id="loading-script"');
                expect($('link[href="style.css"]')).toBeTag({
                    tagName: "link",
                    attributes: {href: "style.css", rel: "stylesheet"},
                });
                expect($('link[href="assets/astyle-1.css"]')).toBeTag({
                    tagName: "link",
                    attributes: {href: "assets/astyle-1.css", rel: "stylesheet"},
                });
                expect($('link[href="the-href-1"]')).toBeTag({
                    tagName: "link",
                    attributes: {href: "the-href-1", rel: "the-rel-1", sizes: "16x16"},
                });
                expect($('link[href="assets/astyle-2.css"]')).toBeTag({
                    tagName: "link",
                    attributes: {href: "assets/astyle-2.css", rel: "stylesheet"},
                });
                expect($('link[href="the-href-2"]')).toBeTag({
                    tagName: "link",
                    attributes: {href: "the-href-2", rel: "the-rel-2", sizes: "16x16"},
                });
                cleanup(result.outputDir);
            });

            it("should append links and tags together with a custom index.html template when append is set to false", async () => {
                const result = await compile({
                    htmlOptions: {template: INDEX_HTML},
                    options: {
                        tags: [{path: "assets/astyle.css", sourcePath: "test/fixtures/astyle.css"}],
                        append: false,
                        links: [{path: "the-href", attributes: {rel: "the-rel", sizes: "16x16"}}],
                    },
                });
                expect(result.error).toBeFalsy();
                expect(result.errors).toHaveLength(0);
                const $ = cheerio.load(result.html());
                expect($("script").length).toBe(3);
                expect($("link").length).toBe(3);
                expect($('script[src="app.js"]')).toBeTag({tagName: "script", attributes: {src: "app.js"}});
                expect($('script[src="style.js"]')).toBeTag({tagName: "script", attributes: {src: "style.js"}});
                expect($('script[id="loading-script"]').toString()).toContain('<script id="loading-script"');
                expect($('link[href="style.css"]')).toBeTag({
                    tagName: "link",
                    attributes: {href: "style.css", rel: "stylesheet"},
                });
                expect($('link[href="assets/astyle.css"]')).toBeTag({
                    tagName: "link",
                    attributes: {href: "assets/astyle.css", rel: "stylesheet"},
                });
                expect($('link[href="the-href"]')).toBeTag({
                    tagName: "link",
                    attributes: {href: "the-href", rel: "the-rel", sizes: "16x16"},
                });
                cleanup(result.outputDir);
            });

            it("should append links and tags together with a custom index.html template when append is set to true", async () => {
                const result = await compile({
                    htmlOptions: {template: INDEX_HTML},
                    options: {
                        tags: [{path: "assets/astyle.css", sourcePath: "test/fixtures/astyle.css"}],
                        append: true,
                        links: [{path: "the-href", attributes: {rel: "the-rel", sizes: "16x16"}}],
                    },
                });
                expect(result.error).toBeFalsy();
                expect(result.errors).toHaveLength(0);
                const $ = cheerio.load(result.html());
                expect($("script").length).toBe(3);
                expect($("link").length).toBe(3);
                expect($('script[src="app.js"]')).toBeTag({tagName: "script", attributes: {src: "app.js"}});
                expect($('script[src="style.js"]')).toBeTag({tagName: "script", attributes: {src: "style.js"}});
                expect($('script[id="loading-script"]').toString()).toContain('<script id="loading-script"');
                expect($('link[href="style.css"]')).toBeTag({
                    tagName: "link",
                    attributes: {href: "style.css", rel: "stylesheet"},
                });
                expect($('link[href="the-href"]')).toBeTag({
                    tagName: "link",
                    attributes: {href: "the-href", rel: "the-rel", sizes: "16x16"},
                });
                expect($('link[href="assets/astyle.css"]')).toBeTag({
                    tagName: "link",
                    attributes: {href: "assets/astyle.css", rel: "stylesheet"},
                });
                cleanup(result.outputDir);
            });

            it("should append links and tags together when append is set to false", async () => {
                const result = await compile({
                    options: {
                        tags: [{path: "assets/astyle.css", sourcePath: "test/fixtures/astyle.css"}],
                        append: false,
                        links: [{path: "the-href", attributes: {rel: "the-rel", sizes: "16x16"}}],
                    },
                });
                expect(result.error).toBeFalsy();
                expect(result.errors).toHaveLength(0);
                const $ = cheerio.load(result.html());
                expect($("script").length).toBe(2);
                expect($("link").length).toBe(3);
                expect($('script[src="app.js"]')).toBeTag({tagName: "script", attributes: {src: "app.js"}});
                expect($('script[src="style.js"]')).toBeTag({tagName: "script", attributes: {src: "style.js"}});
                expect($('link[href="style.css"]')).toBeTag({
                    tagName: "link",
                    attributes: {href: "style.css", rel: "stylesheet"},
                });
                expect($('link[href="the-href"]')).toBeTag({
                    tagName: "link",
                    attributes: {href: "the-href", rel: "the-rel", sizes: "16x16"},
                });
                expect($('link[href="assets/astyle.css"]')).toBeTag({
                    tagName: "link",
                    attributes: {href: "assets/astyle.css", rel: "stylesheet"},
                });
                cleanup(result.outputDir);
            });

            it("should append links and tags together when append is set to true", async () => {
                const result = await compile({
                    options: {
                        tags: [{path: "assets/astyle.css", sourcePath: "test/fixtures/astyle.css"}],
                        append: true,
                        links: [{path: "the-href", attributes: {rel: "the-rel", sizes: "16x16"}}],
                    },
                });
                expect(result.error).toBeFalsy();
                expect(result.errors).toHaveLength(0);
                const $ = cheerio.load(result.html());
                expect($("script").length).toBe(2);
                expect($("link").length).toBe(3);
                expect($('script[src="app.js"]')).toBeTag({tagName: "script", attributes: {src: "app.js"}});
                expect($('script[src="style.js"]')).toBeTag({tagName: "script", attributes: {src: "style.js"}});
                expect($('link[href="style.css"]')).toBeTag({
                    tagName: "link",
                    attributes: {href: "style.css", rel: "stylesheet"},
                });
                expect($('link[href="the-href"]')).toBeTag({
                    tagName: "link",
                    attributes: {href: "the-href", rel: "the-rel", sizes: "16x16"},
                });
                expect($('link[href="assets/astyle.css"]')).toBeTag({
                    tagName: "link",
                    attributes: {href: "assets/astyle.css", rel: "stylesheet"},
                });
                cleanup(result.outputDir);
            });
        });

        describe("options.tags & options.scripts & options.links & options.metas", () => {
            it("should output all the tags for the options", async () => {
                const result = await compile({
                    htmlOptions: {template: INDEX_HTML},
                    options: {
                        tags: [{path: "a.js"}, {path: "a.css"}],
                        scripts: [{path: "b.js"}],
                        links: [{path: "b.css", attributes: {rel: "the-rel", sizes: "16x16"}}],
                        metas: [{path: "c", attributes: {name: "the-name"}}],
                    },
                });
                expect(result.error).toBeFalsy();
                expect(result.errors).toHaveLength(0);
                const $ = cheerio.load(result.html());
                expect($("script").length).toBe(5);
                expect($("link").length).toBe(3);
                expect($("meta").length).toBe(4);
                expect($('script[src="app.js"]')).toBeTag({tagName: "script", attributes: {src: "app.js"}});
                expect($('script[src="style.js"]')).toBeTag({tagName: "script", attributes: {src: "style.js"}});
                expect($('script[id="loading-script"]').toString()).toContain('<script id="loading-script"');
                expect($('script[src="a.js"]')).toBeTag({tagName: "script", attributes: {src: "a.js"}});
                expect($('script[src="b.js"]')).toBeTag({tagName: "script", attributes: {src: "b.js"}});
                expect($('link[href="style.css"]')).toBeTag({tagName: "link", attributes: {href: "style.css"}});
                expect($('link[href="a.css"]')).toBeTag({tagName: "link", attributes: {href: "a.css"}});
                expect($('link[href="b.css"]')).toBeTag({
                    tagName: "link",
                    attributes: {href: "b.css", rel: "the-rel", sizes: "16x16"},
                });
                expect($('meta[content="c"]')).toBeTag({tagName: "meta", attributes: {content: "c", name: "the-name"}});
                cleanup(result.outputDir);
            });
        });

        describe("options.scripts with attributes", () => {
            const scriptsBoth = [
                {append: true, scripts: [{path: "b.js", attributes: {crossorigin: "anonymous"}}]},
                {append: false, scripts: [{path: "a.js", attributes: {crossorigin: "anonymous"}}]},
            ];

            const assertScriptsBoth = (html: string) => {
                const $ = cheerio.load(html);
                expect($("script").length).toBe(5);
                expect($("link").length).toBe(1);
                expect($('script[src="app.js"]')).toBeTag({tagName: "script", attributes: {src: "app.js"}});
                expect($('script[src="style.js"]')).toBeTag({tagName: "script", attributes: {src: "style.js"}});
                expect($('script[id="loading-script"]').toString()).toContain('<script id="loading-script"');
                expect($('script[src="a.js"]')).toBeTag({
                    tagName: "script",
                    attributes: {src: "a.js", crossorigin: ""},
                });
                expect($('script[src="b.js"]')).toBeTag({
                    tagName: "script",
                    attributes: {src: "b.js", crossorigin: ""},
                });
                expect($('link[href="style.css"]')).toBeTag({tagName: "link", attributes: {href: "style.css"}});
            };

            it("should output all the attributes for scripts when html options inject is the default", async () => {
                const result = await compile({htmlOptions: {template: INDEX_HTML}, options: scriptsBoth});
                expect(result.error).toBeFalsy();
                expect(result.errors).toHaveLength(0);
                assertScriptsBoth(result.html());
                cleanup(result.outputDir);
            });

            it("should output all the attributes for scripts when html options inject is true", async () => {
                const result = await compile({htmlOptions: {inject: true, template: INDEX_HTML}, options: scriptsBoth});
                expect(result.error).toBeFalsy();
                expect(result.errors).toHaveLength(0);
                assertScriptsBoth(result.html());
                cleanup(result.outputDir);
            });

            it("should not output scripts when html options inject is false", async () => {
                const result = await compile({
                    htmlOptions: {inject: false, template: INDEX_HTML},
                    options: scriptsBoth,
                });
                expect(result.error).toBeFalsy();
                expect(result.errors).toHaveLength(0);
                const $ = cheerio.load(result.html());
                expect($("script").length).toBe(1);
                expect($("link").length).toBe(0);
                expect($('script[id="loading-script"]').toString()).toContain('<script id="loading-script"');
                cleanup(result.outputDir);
            });

            it("should output all the attributes for scripts when html options inject is head", async () => {
                const result = await compile({
                    htmlOptions: {inject: "head", template: INDEX_HTML},
                    options: scriptsBoth,
                });
                expect(result.error).toBeFalsy();
                expect(result.errors).toHaveLength(0);
                assertScriptsBoth(result.html());
                cleanup(result.outputDir);
            });

            it("should output all the attributes for scripts when html options inject is body", async () => {
                const result = await compile({
                    htmlOptions: {inject: "body", template: INDEX_HTML},
                    options: scriptsBoth,
                });
                expect(result.error).toBeFalsy();
                expect(result.errors).toHaveLength(0);
                assertScriptsBoth(result.html());
                cleanup(result.outputDir);
            });

            it("should output all the attributes for scripts when html options inject is the default and html options scriptLoading is blocking", async () => {
                const result = await compile({
                    htmlOptions: {scriptLoading: "blocking", template: INDEX_HTML},
                    options: scriptsBoth,
                });
                expect(result.error).toBeFalsy();
                expect(result.errors).toHaveLength(0);
                assertScriptsBoth(result.html());
                cleanup(result.outputDir);
            });

            it("should output all the attributes for scripts when html options inject is the default and html options scriptLoading is defer", async () => {
                const result = await compile({
                    htmlOptions: {scriptLoading: "defer", template: INDEX_HTML},
                    options: scriptsBoth,
                });
                expect(result.error).toBeFalsy();
                expect(result.errors).toHaveLength(0);
                assertScriptsBoth(result.html());
                cleanup(result.outputDir);
            });

            it("should output all the attributes for scripts when html options inject is the default and html options scriptLoading is module", async () => {
                const result = await compile({
                    htmlOptions: {scriptLoading: "module", template: INDEX_HTML},
                    options: scriptsBoth,
                });
                expect(result.error).toBeFalsy();
                expect(result.errors).toHaveLength(0);
                assertScriptsBoth(result.html());
                cleanup(result.outputDir);
            });
        });
    });
});
