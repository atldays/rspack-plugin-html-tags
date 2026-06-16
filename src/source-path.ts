import fs from "node:fs";
import path from "node:path";
import type {Compilation} from "@rspack/core";

/**
 * Read a file from `sourcePath` and emit it as a compilation asset (under its
 * basename), registering it as a file dependency so rebuilds pick up changes.
 */
export function addAsset(assetPath: string, compilation: Compilation): Promise<void> {
    const {webpack, context} = compilation.compiler;
    const resolvedPath = path.resolve(context, assetPath);

    return Promise.all([
        new Promise<fs.Stats>((resolve, reject) => {
            fs.stat(resolvedPath, (err, stats) => (err ? reject(err) : resolve(stats)));
        }),
        new Promise<Buffer>((resolve, reject) => {
            fs.readFile(resolvedPath, (err, data) => (err ? reject(err) : resolve(data)));
        }),
    ]).then(([stat, source]) => {
        const {size} = stat;
        const basename = path.basename(resolvedPath);
        const rawSource = new webpack.sources.RawSource(source, true);
        compilation.fileDependencies.add(resolvedPath);
        compilation.emitAsset(basename, rawSource, {size} as Parameters<Compilation["emitAsset"]>[2]);
    });
}
