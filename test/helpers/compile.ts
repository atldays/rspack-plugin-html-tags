import {spawn} from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type {Options} from "../../src";

export {FIXTURES_PATH, FIXTURES_ENTRY, FIXTURES_STYLE, EXTERNALS_PATH} from "./paths";

const RUNNER = path.join(__dirname, "runner.mjs");
const PROJECT_ROOT = path.join(__dirname, "..", "..");

export interface CompileParams {
    /** Override the `app` entry (defaults to fixtures/entry.js). */
    webpackEntry?: string;
    /** Override the `style` entry (defaults to fixtures/app.css). */
    webpackStyle?: string;
    /** Override output.publicPath. */
    webpackPublicPath?: string;
    /** CopyRspackPlugin patterns. */
    copyOptions?: unknown[];
    /** HtmlRspackPlugin options, or `false` to omit the html plugin entirely. */
    htmlOptions?: Record<string, unknown> | false;
    /** Our plugin's options (single, array, or `false` to omit). */
    options?: Options | Options[] | false;
}

export interface CompileResult {
    /** Fatal compiler error (stack string) passed to the rspack callback, else null. */
    error: string | null;
    /** Collected `compilation.errors` as message strings. */
    errors: string[];
    outputDir: string;
    /** Read a generated file as utf8 (defaults to index.html). */
    html: (name?: string) => string;
    readFile: (name: string) => string;
    fileExists: (name: string) => boolean;
}

interface RunnerResult {
    error: string | null;
    errors: string[];
}

/**
 * Run a real Rspack build of the fixtures with HtmlRspackPlugin + our plugin in
 * a clean child process, returning accessors over the emitted files. Functions
 * in `options` (e.g. addHash/addPublicPath/hash) are transported by source.
 */
export function compile(params: CompileParams): Promise<CompileResult> {
    const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "hrtp-"));
    const serialized = JSON.stringify(params, (_key, value) =>
        typeof value === "function" ? {__fn__: value.toString()} : value
    );
    fs.writeFileSync(path.join(outputDir, "__params.json"), serialized);

    return new Promise<CompileResult>((resolve, reject) => {
        const child = spawn(process.execPath, [RUNNER, outputDir], {cwd: PROJECT_ROOT});
        let stderr = "";
        child.stderr.on("data", chunk => (stderr += chunk));
        child.on("error", reject);
        child.on("close", code => {
            const resultPath = path.join(outputDir, "__result.json");
            if (!fs.existsSync(resultPath)) {
                reject(new Error(`rspack runner exited with ${code} and produced no result:\n${stderr}`));
                return;
            }
            const result = JSON.parse(fs.readFileSync(resultPath, "utf8")) as RunnerResult;
            resolve({
                error: result.error,
                errors: result.errors,
                outputDir,
                html: (name = "index.html") => fs.readFileSync(path.join(outputDir, name), "utf8"),
                readFile: name => fs.readFileSync(path.join(outputDir, name), "utf8"),
                fileExists: name => fs.existsSync(path.join(outputDir, name)),
            });
        });
    });
}

/** True if any collected compilation error message contains `text`. */
export function hasErrorText(result: CompileResult, text: string | string[]): boolean {
    const haystack = result.errors.join("\n");
    return Array.isArray(text) ? text.some(t => haystack.includes(t)) : haystack.includes(text);
}

/** Recursively remove a directory produced by {@link compile}. */
export function cleanup(outputDir: string): void {
    fs.rmSync(outputDir, {recursive: true, force: true});
}
