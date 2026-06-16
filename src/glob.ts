import path from "node:path";
import {globSync} from "glob";
import {assert, toPosix} from "./utils";
import {isBoolean, isDefined, isString} from "./options/guards";
import type {TagObject} from "./types";

/**
 * Expand a tag's `glob`/`globPath`/`globFlatten` properties into one tag object
 * per matched file, prefixing each match with the tag's `path`.
 */
export function expandGlob(tag: Record<string, unknown>, optionName: string, optionPath: string): TagObject[] {
    const {glob: assetGlob, globPath, globFlatten, ...otherAssetProperties} = tag;

    assert(isString(assetGlob), `${optionPath}.${optionName} object should have a string glob property`);
    assert(isString(globPath), `${optionPath}.${optionName} object should have a string globPath property`);
    if (isDefined(globFlatten)) {
        assert(isBoolean(globFlatten), `${optionPath}.${optionName} object should have a boolean globFlatten property`);
    }

    const flatten = isDefined(globFlatten) ? (globFlatten as boolean) : false;
    const tagPath = tag.path as string;
    const globAssets = globSync(assetGlob as string, {cwd: globPath as string});
    const globAssetPaths = globAssets.map(globAsset =>
        toPosix(path.join(tagPath, flatten ? path.basename(globAsset) : globAsset))
    );

    assert(
        globAssetPaths.length > 0,
        `${optionPath}.${optionName} object glob found no files (${tagPath} ${assetGlob} ${globPath})`
    );

    return globAssetPaths.map(globAssetPath => ({...otherAssetProperties, path: globAssetPath}) as TagObject);
}
