import type {Compilation} from "@rspack/core";
import {getTagPath} from "../tag-path";
import {isDefined} from "../options/guards";
import type {SkippableData} from "../files";
import type {SharedState} from "./before-asset-tag-generation";
import type {
    AlterAssetTagGroupsData,
    AttributesObject,
    HtmlTagObject,
    MetaObject,
    TagObject,
    ValidatedOptions,
} from "../types";

type Callback = (error?: Error | null, data?: AlterAssetTagGroupsData) => void;

const coerceAttributeValue = (value: string | boolean | number): string | boolean =>
    typeof value === "string" || typeof value === "boolean" ? value : value.toString();

/**
 * Build the `alterAssetTagGroups` tap handler for a single compilation. It
 * injects meta tags into the head and copies user-provided `attributes` onto
 * the generated link/script tags created during the before-hook.
 */
export function createAlterAssetTagGroups(
    options: ValidatedOptions,
    shouldSkip: (data: SkippableData) => boolean,
    state: SharedState,
    compilation: Compilation
) {
    const linksPrepend = options.linksPrepend ?? [];
    const linksAppend = options.linksAppend ?? [];
    const scriptsPrepend = options.scriptsPrepend ?? [];
    const scriptsAppend = options.scriptsAppend ?? [];
    const metas = options.metas;

    return (htmlPluginData: AlterAssetTagGroupsData, callback: Callback): void => {
        if (shouldSkip(htmlPluginData)) {
            callback(null, htmlPluginData);
            return;
        }

        const pluginHead = htmlPluginData.headTags;
        const pluginBody = htmlPluginData.bodyTags;

        if (metas) {
            const pluginPublicPath = state.publicPath;
            const compilationHash = compilation.hash ?? "";

            const getMeta = (tag: MetaObject): HtmlTagObject => {
                const attributes: HtmlTagObject["attributes"] = {};
                if (isDefined(tag.path)) {
                    attributes.content = getTagPath(
                        tag as unknown as TagObject,
                        options,
                        pluginPublicPath,
                        compilationHash
                    );
                }
                copyAttributesInto(attributes, tag.attributes);
                return {tagName: "meta", voidTag: true, attributes};
            };
            pluginHead.push(...metas.map(getMeta));
        }

        const injectOption = htmlPluginData.plugin.options.inject;
        const sourceScripts =
            injectOption === "body"
                ? pluginBody
                : htmlPluginData.plugin.options.scriptLoading === "blocking"
                  ? pluginBody
                  : pluginHead;

        const pluginLinks = pluginHead.filter(({tagName}) => tagName === "link");
        const pluginScripts = sourceScripts.filter(({tagName}) => tagName === "script");

        const headPrepend = pluginLinks.slice(0, linksPrepend.length);
        const headAppend = pluginLinks.slice(pluginLinks.length - linksAppend.length);

        const bodyPrepend = pluginScripts.slice(0, scriptsPrepend.length);
        const bodyAppend = pluginScripts.slice(pluginScripts.length - scriptsAppend.length);

        const copyAttributes = (tags: HtmlTagObject[], tagObjects: TagObject[]): void => {
            tags.forEach((tag, i) => {
                const attributes = tagObjects[i]?.attributes;
                if (attributes) {
                    copyAttributesInto(tag.attributes, attributes);
                }
            });
        };

        copyAttributes(headPrepend.concat(headAppend), linksPrepend.concat(linksAppend));
        copyAttributes(bodyPrepend.concat(bodyAppend), scriptsPrepend.concat(scriptsAppend));

        callback(null, htmlPluginData);
    };
}

function copyAttributesInto(target: HtmlTagObject["attributes"], source: AttributesObject): void {
    Object.keys(source).forEach(attribute => {
        const value = source[attribute];
        if (value !== undefined) {
            target[attribute] = coerceAttributeValue(value);
        }
    });
}
