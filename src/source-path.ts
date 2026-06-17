import fs from "node:fs";
import path from "node:path";
import type {Compilation} from "@rspack/core";

/**
 * Read a file from `sourcePath` and emit it as a compilation asset, registering
 * it as a file dependency so rebuilds pick up changes. The asset is emitted at
 * `outputName` (the tag's output-relative `path`) so it matches the injected
 * tag's reference; if omitted, the source file's basename is used.
 */
export function addAsset(sourcePath: string, compilation: Compilation, outputName?: string): Promise<void> {
    const {webpack, context} = compilation.compiler;
    const resolvedPath = path.resolve(context, sourcePath);

    return Promise.all([
        new Promise<fs.Stats>((resolve, reject) => {
            fs.stat(resolvedPath, (err, stats) => (err ? reject(err) : resolve(stats)));
        }),
        new Promise<Buffer>((resolve, reject) => {
            fs.readFile(resolvedPath, (err, data) => (err ? reject(err) : resolve(data)));
        }),
    ]).then(([stat, source]) => {
        const {size} = stat;
        const target = outputName ?? path.basename(resolvedPath);
        const rawSource = new webpack.sources.RawSource(source, true);
        compilation.fileDependencies.add(resolvedPath);
        compilation.emitAsset(target, rawSource, {size} as Parameters<Compilation["emitAsset"]>[2]);
    });
}
