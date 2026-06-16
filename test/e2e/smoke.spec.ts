import * as cheerio from "cheerio";
import {cleanup, compile} from "../helpers/compile";

describe("e2e smoke", () => {
    it("includes a single js file and appends it", async () => {
        const result = await compile({options: {tags: "foobar.js", append: true, publicPath: false}});
        expect(result.error).toBeFalsy();
        expect(result.errors).toHaveLength(0);

        const $ = cheerio.load(result.html());
        expect($("script").length).toBe(3);
        expect($("link").length).toBe(1);
        expect($('script[src="app.js"]')).toBeTag({tagName: "script", attributes: {src: "app.js"}});
        expect($('script[src="style.js"]')).toBeTag({tagName: "script", attributes: {src: "style.js"}});
        expect($('link[href="style.css"]')).toBeTag({
            tagName: "link",
            attributes: {href: "style.css", rel: "stylesheet"},
        });
        expect($('script[src="foobar.js"]')).toBeTag({tagName: "script", attributes: {src: "foobar.js"}});

        cleanup(result.outputDir);
    });

    it("throws an error if HtmlRspackPlugin is not in the config", async () => {
        const result = await compile({htmlOptions: false, options: {tags: "foobar.js", publicPath: false}});
        expect(result.error).toBeTruthy();
        expect(result.error).toMatch(
            /(are you sure you have HtmlRspackPlugin before it in your rspack config's plugins)/
        );
    });
});
