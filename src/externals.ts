import type {Compiler} from "@rspack/core";
import type {TagObject} from "./types";

/**
 * Register script `external` mappings onto `compiler.options.externals` without
 * clobbering an existing config:
 * - object / undefined → merge the mappings in;
 * - array → append the mappings as a new array entry;
 * - function / string / RegExp → wrap into an array, preserving the original.
 */
export function registerExternals(compiler: Compiler, scripts: TagObject[]): void {
    const mapping: Record<string, string> = {};
    for (const script of scripts) {
        const {external} = script;
        if (external) {
            mapping[external.packageName] = external.variableName;
        }
    }
    if (Object.keys(mapping).length === 0) {
        return;
    }

    const current = compiler.options.externals as unknown;
    let next: unknown;
    if (current === undefined || current === null) {
        next = mapping;
    } else if (Array.isArray(current)) {
        next = [...current, mapping];
    } else if (typeof current === "object" && !(current instanceof RegExp)) {
        next = {...(current as Record<string, unknown>), ...mapping};
    } else {
        // function | string | RegExp — keep the original by wrapping in an array.
        next = [current, mapping];
    }
    compiler.options.externals = next as Compiler["options"]["externals"];
}
