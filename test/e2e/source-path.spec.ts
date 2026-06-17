import * as path from "node:path";
import {cleanup, compile, FIXTURES_PATH} from "../helpers/compile";

describe("sourcePath emit target", () => {
    it("emits the copied asset at the tag's path, not the source basename", async () => {
        const result = await compile({
            options: {
                append: true,
                publicPath: false,
                links: [
                    {
                        path: "assets/copied.css",
                        sourcePath: path.join(FIXTURES_PATH, "astyle.css"),
                        attributes: {rel: "stylesheet"},
                    },
                ],
            },
        });

        expect(result.error).toBeFalsy();
        expect(result.errors).toHaveLength(0);
        // Emitted where the injected tag references it...
        expect(result.fileExists("assets/copied.css")).toBe(true);
        // ...and not at the source file's basename.
        expect(result.fileExists("astyle.css")).toBe(false);

        cleanup(result.outputDir);
    });
});
