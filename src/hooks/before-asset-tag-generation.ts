import type {Compilation} from "@rspack/core";
import {getTagPath} from "../tag-path";
import {addAsset} from "../source-path";
import {isString} from "../options/guards";
import type {SkippableData} from "../files";
import type {BeforeAssetTagGenerationData, MetaObject, TagObject, ValidatedOptions} from "../types";

export interface SharedState {
    publicPath: string;
}

type Callback = (error?: Error | null, data?: BeforeAssetTagGenerationData) => void;

/**
 * Build the `beforeAssetTagGeneration` tap handler for a single compilation.
 * It merges the prepend/append asset paths into the html plugin's js/css asset
 * lists (applying publicPath + hash) and emits any `sourcePath` assets.
 */
export function createBeforeAssetTagGeneration(
    options: ValidatedOptions,
    shouldSkip: (data: SkippableData) => boolean,
    state: SharedState,
    compilation: Compilation
) {
    const scriptsPrepend = options.scriptsPrepend ?? [];
    const scriptsAppend = options.scriptsAppend ?? [];
    const linksPrepend = options.linksPrepend ?? [];
    const linksAppend = options.linksAppend ?? [];
    const metas = options.metas;

    return (htmlPluginData: BeforeAssetTagGenerationData, callback: Callback): void => {
        if (shouldSkip(htmlPluginData)) {
            callback(null, htmlPluginData);
            return;
        }

        const {assets} = htmlPluginData;
        const pluginPublicPath = assets.publicPath;
        state.publicPath = pluginPublicPath;
        const compilationHash = compilation.hash ?? "";
        const assetPromises: Array<Promise<void>> = [];

        const getPath = (tag: TagObject): string => {
            if (isString(tag.sourcePath)) {
                assetPromises.push(addAsset(tag.sourcePath, compilation));
            }
            return getTagPath(tag, options, pluginPublicPath, compilationHash);
        };

        const jsPrependPaths = scriptsPrepend.map(getPath);
        const jsAppendPaths = scriptsAppend.map(getPath);
        const cssPrependPaths = linksPrepend.map(getPath);
        const cssAppendPaths = linksAppend.map(getPath);

        assets.js = jsPrependPaths.concat(assets.js).concat(jsAppendPaths);
        assets.css = cssPrependPaths.concat(assets.css).concat(cssAppendPaths);

        if (metas) {
            metas.forEach((tag: MetaObject) => {
                if (isString(tag.sourcePath)) {
                    assetPromises.push(addAsset(tag.sourcePath, compilation));
                }
            });
        }

        Promise.all(assetPromises).then(
            () => callback(null, htmlPluginData),
            (error: Error) => callback(error)
        );
    };
}
