import type {Compiler} from "@rspack/core";
import type {TagObject} from "./types";

/**
 * Register script `external` mappings onto `compiler.options.externals`.
 *
 * NOTE: like the original plugin, this assumes `externals` is an object (or
 * undefined). Array / function / string `externals` are not merged into — that
 * edge case is preserved as-is from upstream.
 */
export function registerExternals(compiler: Compiler, scripts: TagObject[]): void {
    const externals = ((compiler.options.externals as Record<string, unknown>) || {}) as Record<string, unknown>;
    scripts.forEach(script => {
        const {external} = script;
        if (external) {
            externals[external.packageName] = external.variableName;
        }
    });
    compiler.options.externals = externals as Compiler["options"]["externals"];
}
