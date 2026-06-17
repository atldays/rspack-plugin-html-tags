import {toPosix} from "./utils";
import {isDefined} from "./options/guards";
import type {AddHashFunction, AddPublicPathFunction, TagObject, ValidatedOptions} from "./types";

/**
 * Resolve the final asset path for a tag, applying (in order) the public path
 * then the hash. Tag-level options override the plugin-level ones.
 */
export function getTagPath(
    tagObject: TagObject,
    options: ValidatedOptions,
    webpackPublicPath: string,
    compilationHash: string
): string {
    const mergedOptions: Record<string, unknown> = {...options};
    Object.keys(tagObject).forEach(key => {
        if (isDefined(tagObject[key])) {
            mergedOptions[key] = tagObject[key];
        }
    });

    const usePublicPath = mergedOptions.usePublicPath as boolean | undefined;
    const addPublicPath = mergedOptions.addPublicPath as AddPublicPathFunction | undefined;
    const useHash = mergedOptions.useHash as boolean | undefined;
    const addHash = mergedOptions.addHash as AddHashFunction | undefined;

    let assetPath = tagObject.path;
    if (usePublicPath && addPublicPath) {
        assetPath = addPublicPath(assetPath, webpackPublicPath);
    }
    if (useHash && addHash) {
        assetPath = addHash(assetPath, compilationHash);
    }
    return toPosix(assetPath);
}
