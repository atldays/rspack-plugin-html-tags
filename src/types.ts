// ---------------------------------------------------------------------------
// Public option types — adapted from the original `html-rspack-tags-plugin` /
// `html-webpack-tags-plugin` typings, renamed for this package.
// ---------------------------------------------------------------------------

export type AddHashFunction = (assetPath: string, hash: string) => string;
export type AddPublicPathFunction = (assetPath: string, publicPath: string) => string;
export type TypeString = "css" | "js";
export type AttributesObject = {[attributeName: string]: string | boolean | number};

export interface CommonOptions {
    append?: boolean;
    useHash?: boolean;
    addHash?: AddHashFunction;
    hash?: boolean | string | AddHashFunction;
    usePublicPath?: boolean;
    addPublicPath?: AddPublicPathFunction;
    publicPath?: boolean | string | AddPublicPathFunction;
}

export interface ExternalObject {
    packageName: string;
    variableName: string;
}

export interface BaseTagOptions extends CommonOptions {
    glob?: string;
    globPath?: string;
    globFlatten?: boolean;
    sourcePath?: string;
}

export interface LinkTagOptions extends BaseTagOptions {
    path: string;
    attributes?: AttributesObject;
}

export interface ScriptTagOptions extends BaseTagOptions {
    path: string;
    attributes?: AttributesObject;
    external?: ExternalObject;
}

export interface MaybeLinkTagOptions extends LinkTagOptions {
    type?: TypeString;
}

export interface MaybeScriptTagOptions extends ScriptTagOptions {
    type?: TypeString;
}

export interface MetaTagOptions extends BaseTagOptions {
    path?: string;
    attributes: AttributesObject;
}

export interface HtmlTagsPluginOptions extends CommonOptions {
    append?: boolean;
    prependExternals?: boolean;
    jsExtensions?: string | string[];
    cssExtensions?: string | string[];
    files?: string | string[];
    tags?:
        | string
        | MaybeLinkTagOptions
        | MaybeScriptTagOptions
        | Array<string | MaybeLinkTagOptions | MaybeScriptTagOptions>;
    links?: string | LinkTagOptions | Array<string | LinkTagOptions>;
    scripts?: string | ScriptTagOptions | Array<string | ScriptTagOptions>;
    metas?: string | MetaTagOptions | Array<string | MetaTagOptions>;
}

// ---------------------------------------------------------------------------
// Internal (post-validation) shapes. These are intentionally loose and carry
// an index signature so that unknown user keys pass through untouched, exactly
// as the original implementation did.
// ---------------------------------------------------------------------------

export interface TagObject {
    path: string;
    type?: TypeString;
    attributes?: AttributesObject;
    external?: ExternalObject;
    sourcePath?: string;
    append?: boolean;
    usePublicPath?: boolean;
    addPublicPath?: AddPublicPathFunction;
    useHash?: boolean;
    addHash?: AddHashFunction;
    [key: string]: unknown;
}

export interface MetaObject {
    path?: string;
    attributes: AttributesObject;
    sourcePath?: string;
    [key: string]: unknown;
}

export interface ValidatedOptions {
    append?: boolean;
    prependExternals?: boolean;
    usePublicPath?: boolean;
    addPublicPath?: AddPublicPathFunction;
    useHash?: boolean;
    addHash?: AddHashFunction;
    jsExtensions?: string | string[];
    cssExtensions?: string | string[];
    links?: TagObject[];
    scripts?: TagObject[];
    linksPrepend?: TagObject[];
    linksAppend?: TagObject[];
    scriptsPrepend?: TagObject[];
    scriptsAppend?: TagObject[];
    metas?: MetaObject[];
    files?: string[];
    [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Minimal local mirror of the `HtmlRspackPlugin` hook payloads. The concrete
// `Js*` types live in `@rspack/binding` and are not re-exported from
// `@rspack/core`'s public surface, so we declare just the fields we read. This
// keeps the plugin compilable against the whole `@rspack/core ^1 || ^2` range
// without depending on internal/transitive type paths.
// ---------------------------------------------------------------------------

export interface HtmlTagObject {
    tagName: string;
    attributes: Record<string, string | boolean | undefined | null>;
    voidTag: boolean;
    innerHTML?: string;
    asset?: string;
}

export interface HtmlPluginAssets {
    publicPath: string;
    js: string[];
    css: string[];
    favicon?: string;
}

export interface HtmlPluginOptions {
    inject?: boolean | "head" | "body";
    scriptLoading?: "blocking" | "defer" | "module" | "systemjs-module";
    [key: string]: unknown;
}

export interface BeforeAssetTagGenerationData {
    assets: HtmlPluginAssets;
    outputName: string;
    plugin: {options: HtmlPluginOptions};
}

export interface AlterAssetTagGroupsData {
    headTags: HtmlTagObject[];
    bodyTags: HtmlTagObject[];
    publicPath: string;
    outputName: string;
    plugin: {options: HtmlPluginOptions};
}

export interface TappableHook<T> {
    tapAsync(name: string, fn: (data: T, callback: (error?: Error | null, data?: T) => void) => void): void;
}

export interface HtmlRspackPluginHooks {
    beforeAssetTagGeneration: TappableHook<BeforeAssetTagGenerationData>;
    alterAssetTagGroups: TappableHook<AlterAssetTagGroupsData>;
}
