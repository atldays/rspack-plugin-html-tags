import type {AddHashFunction, AddPublicPathFunction, TypeString} from "../types";

export const ASSET_TYPE_CSS = "css";
export const ASSET_TYPE_JS = "js";
export const ASSET_TYPES: TypeString[] = [ASSET_TYPE_CSS, ASSET_TYPE_JS];

export const ATTRIBUTES_TEXT = "strings, booleans or numbers";

export const defaultAddHash: AddHashFunction = (assetPath, hash) => assetPath + "?" + hash;

export const defaultAddPublicPath: AddPublicPathFunction = (assetPath, publicPath) =>
    publicPath !== "" && !publicPath.endsWith("/") && !assetPath.startsWith("/")
        ? publicPath + "/" + assetPath
        : publicPath + assetPath;

export interface DefaultOptions {
    append: boolean;
    prependExternals: boolean;
    useHash: boolean;
    addHash: AddHashFunction;
    usePublicPath: boolean;
    addPublicPath: AddPublicPathFunction;
    jsExtensions: string[];
    cssExtensions: string[];
    tags: unknown[];
    links: unknown[];
    scripts: unknown[];
}

export const DEFAULT_OPTIONS: DefaultOptions = {
    append: true,
    prependExternals: true,
    useHash: false,
    addHash: defaultAddHash,
    usePublicPath: true,
    addPublicPath: defaultAddPublicPath,
    jsExtensions: [".js"],
    cssExtensions: [".css"],
    tags: [],
    links: [],
    scripts: [],
};
