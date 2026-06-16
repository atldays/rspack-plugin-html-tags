import {assert} from "../utils";
import {expandGlob} from "../glob";
import type {MetaObject, TagObject, ValidatedOptions} from "../types";
import {
    isArray,
    isArrayOfString,
    isBoolean,
    isDefined,
    isFunctionReturningString,
    isObject,
    isString,
    isType,
    isTypeCss,
    isValidAttributeValue,
} from "./guards";
import {ATTRIBUTES_TEXT, DEFAULT_OPTIONS, defaultAddHash, defaultAddPublicPath} from "./defaults";

type Loose = Record<string, unknown>;

type ExtensionOptionName = "jsExtensions" | "cssExtensions";

const createExtensionsRegex = (extensions: string[]): RegExp => new RegExp(`.*(${extensions.join("|")})$`);

const getExtensions = (options: Loose, optionExtensionName: ExtensionOptionName, optionPath: string): string[] => {
    const value = options[optionExtensionName];
    if (!isDefined(value)) {
        return DEFAULT_OPTIONS[optionExtensionName];
    }
    if (isString(value)) {
        return [value];
    }
    assert(isArray(value), `${optionPath}.${optionExtensionName} should be a string or array of strings (${value})`);
    (value as unknown[]).forEach(extension => {
        assert(
            isString(extension),
            `${optionPath}.${optionExtensionName} array should only contain strings (${extension})`
        );
    });
    return value as string[];
};

const getHasExtensions = (options: Loose, optionExtensionName: ExtensionOptionName, optionPath: string) => {
    const regexp = createExtensionsRegex(getExtensions(options, optionExtensionName, optionPath));
    return (value: string): boolean => regexp.test(value);
};

const getAssetTypeCheckers = (options: Loose, optionPath: string) => {
    const hasJsExtensions = getHasExtensions(options, "jsExtensions", optionPath);
    const hasCssExtensions = getHasExtensions(options, "cssExtensions", optionPath);
    return {
        isAssetTypeCss: (value: string): boolean => hasCssExtensions(value),
        isAssetTypeJs: (value: string): boolean => hasJsExtensions(value),
    };
};

const splitLinkScriptTags = (
    tagObjects: TagObject[],
    options: Loose,
    optionName: string,
    optionPath: string
): [TagObject[], TagObject[]] => {
    const linkObjects: TagObject[] = [];
    const scriptObjects: TagObject[] = [];
    const {isAssetTypeCss, isAssetTypeJs} = getAssetTypeCheckers(options, optionPath);

    tagObjects.forEach(tagObject => {
        if (isDefined(tagObject.type)) {
            const {type, ...others} = tagObject;
            assert(isType(type), `${optionPath}.${optionName} type must be css or js (${type})`);
            (isTypeCss(type) ? linkObjects : scriptObjects).push({...others} as TagObject);
        } else {
            const {path} = tagObject;
            if (isAssetTypeCss(path)) {
                linkObjects.push(tagObject);
            } else if (isAssetTypeJs(path)) {
                scriptObjects.push(tagObject);
            } else {
                assert(false, `${optionPath}.${optionName} could not determine asset type for (${path})`);
            }
        }
    });

    return [linkObjects, scriptObjects];
};

const processShortcuts = (
    options: Loose,
    optionPath: string,
    keyShortcut: string,
    keyUse: string,
    keyAdd: string,
    add: (assetPath: string, value: string) => string
): Loose => {
    const processedOptions: Loose = {};
    if (isDefined(options[keyUse]) || isDefined(options[keyAdd])) {
        assert(
            !isDefined(options[keyShortcut]),
            `${optionPath}.${keyShortcut} should not be used with either ${keyUse} or ${keyAdd}`
        );
        if (isDefined(options[keyUse])) {
            assert(isBoolean(options[keyUse]), `${optionPath}.${keyUse} should be a boolean`);
            processedOptions[keyUse] = options[keyUse];
        }
        if (isDefined(options[keyAdd])) {
            assert(
                isFunctionReturningString(options[keyAdd]),
                `${optionPath}.${keyAdd} should be a function that returns a string`
            );
            processedOptions[keyAdd] = options[keyAdd];
        }
    } else if (isDefined(options[keyShortcut])) {
        const shortcut = options[keyShortcut];
        assert(
            isBoolean(shortcut) || isString(shortcut) || isFunctionReturningString(shortcut),
            `${optionPath}.${keyShortcut} should be a boolean or a string or a function that returns a string`
        );
        if (isBoolean(shortcut)) {
            processedOptions[keyUse] = shortcut;
        } else if (isString(shortcut)) {
            processedOptions[keyUse] = true;
            processedOptions[keyAdd] = (assetPath: string) => add(assetPath, shortcut);
        } else {
            processedOptions[keyUse] = true;
            processedOptions[keyAdd] = shortcut;
        }
    }
    return processedOptions;
};

export const getValidatedMainOptions = (options: Loose, optionPath: string, defaultOptions: Loose = {}): Loose => {
    // `publicPath`/`usePublicPath`/`addPublicPath`/`hash`/`useHash`/`addHash` are
    // intentionally pulled out of `otherOptions` here (they are re-derived and
    // validated below via processShortcuts). Every other key passes through.
    const {
        append,
        prependExternals,
        publicPath,
        usePublicPath,
        addPublicPath,
        hash,
        useHash,
        addHash,
        ...otherOptions
    } = options;

    const validatedOptions: Loose = {...defaultOptions, ...otherOptions};
    if (isDefined(append)) {
        assert(isBoolean(append), `${optionPath}.append should be a boolean`);
        validatedOptions.append = append;
    }
    if (isDefined(prependExternals)) {
        assert(isBoolean(prependExternals), `${optionPath}.prependExternals should be a boolean`);
        validatedOptions.prependExternals = prependExternals;
    }
    const publicPathOptions = processShortcuts(
        options,
        optionPath,
        "publicPath",
        "usePublicPath",
        "addPublicPath",
        defaultAddPublicPath
    );
    if (isDefined(publicPathOptions.usePublicPath)) {
        validatedOptions.usePublicPath = publicPathOptions.usePublicPath;
    }
    if (isDefined(publicPathOptions.addPublicPath)) {
        validatedOptions.addPublicPath = publicPathOptions.addPublicPath;
    }
    const hashOptions = processShortcuts(options, optionPath, "hash", "useHash", "addHash", defaultAddHash);
    if (isDefined(hashOptions.useHash)) {
        validatedOptions.useHash = hashOptions.useHash;
    }
    if (isDefined(hashOptions.addHash)) {
        validatedOptions.addHash = hashOptions.addHash;
    }
    return validatedOptions;
};

const getTagObjects = (
    tag: unknown,
    optionName: string,
    optionPath: string,
    isMetaTag = false
): Array<TagObject | MetaObject> => {
    if (isMetaTag) {
        assert(isObject(tag), `${optionPath}.${optionName} items must be an object`);
    } else {
        assert(isString(tag) || isObject(tag), `${optionPath}.${optionName} items must be an object or string`);
    }

    if (!isMetaTag && isString(tag)) {
        return [{path: tag}];
    }

    const tagObj = tag as Loose;
    if (isMetaTag) {
        if (isDefined(tagObj.path)) {
            assert(isString(tagObj.path), `${optionPath}.${optionName} object should have a string path property`);
        }
    } else {
        assert(isString(tagObj.path), `${optionPath}.${optionName} object must have a string path property`);
    }
    if (isDefined(tagObj.sourcePath)) {
        assert(
            isString(tagObj.sourcePath),
            `${optionPath}.${optionName} object should have a string sourcePath property`
        );
    }
    if (isMetaTag) {
        assert(
            isDefined(tagObj.attributes),
            `${optionPath}.${optionName} object must have an object attributes property`
        );
        assert(
            Object.keys(tagObj.attributes as object).length > 0,
            `${optionPath}.${optionName} object must have a non empty object attributes property`
        );
    }
    if (isDefined(tagObj.attributes)) {
        const attributes = tagObj.attributes;
        assert(isObject(attributes), `${optionPath}.${optionName} object should have an object attributes property`);
        Object.keys(attributes).forEach(attribute => {
            const value = (attributes as Loose)[attribute];
            assert(
                isValidAttributeValue(value),
                `${optionPath}.${optionName} object attribute values should be ` + ATTRIBUTES_TEXT
            );
        });
    }

    const validatedTag = getValidatedMainOptions(tagObj, `${optionPath}.${optionName}`, {});

    if (isDefined(validatedTag.glob) || isDefined(validatedTag.globPath) || isDefined(validatedTag.globFlatten)) {
        if (isMetaTag) {
            assert(
                isDefined(validatedTag.path),
                `${optionPath}.${optionName} object must have a path property when glob is used`
            );
        }
        return expandGlob(validatedTag, optionName, optionPath);
    }
    return [validatedTag as unknown as TagObject];
};

const getValidatedTagObjects = (options: Loose, optionName: string, optionPath: string): TagObject[] | undefined => {
    if (!isDefined(options[optionName])) {
        return undefined;
    }
    const tags = options[optionName];
    assert(
        isString(tags) || isObject(tags) || isArray(tags),
        `${optionPath}.${optionName} should be a string, object, or array (${tags})`
    );
    if (isArray(tags)) {
        let tagObjects: TagObject[] = [];
        tags.forEach(asset => {
            tagObjects = tagObjects.concat(getTagObjects(asset, optionName, optionPath) as TagObject[]);
        });
        return tagObjects;
    }
    return getTagObjects(tags, optionName, optionPath) as TagObject[];
};

const getValidatedMetaObjects = (options: Loose, optionName: string, optionPath: string): MetaObject[] | undefined => {
    if (!isDefined(options[optionName])) {
        return undefined;
    }
    const tags = options[optionName];
    assert(isObject(tags) || isArray(tags), `${optionPath}.${optionName} should be an object or array (${tags})`);
    if (isArray(tags)) {
        let metaObjects: MetaObject[] = [];
        tags.forEach(asset => {
            metaObjects = metaObjects.concat(getTagObjects(asset, optionName, optionPath, true) as MetaObject[]);
        });
        return metaObjects;
    }
    return getTagObjects(tags, optionName, optionPath, true) as MetaObject[];
};

const getValidatedTagObjectExternals = <T extends TagObject | MetaObject>(
    tagObjects: T[],
    isScript: boolean,
    optionName: string,
    optionPath: string
): T[] => {
    return tagObjects.map(tagObject => {
        if (isObject(tagObject) && isDefined((tagObject as Loose).external)) {
            const external = (tagObject as Loose).external;
            if (isScript) {
                assert(isObject(external), `${optionPath}.${optionName}.external should be an object`);
                const {packageName, variableName} = external as Loose;
                assert(
                    isString(packageName) || isString(variableName),
                    `${optionPath}.${optionName}.external should have a string packageName and variableName property`
                );
                assert(
                    isString(packageName),
                    `${optionPath}.${optionName}.external should have a string packageName property`
                );
                assert(
                    isString(variableName),
                    `${optionPath}.${optionName}.external should have a string variableName property`
                );
            } else {
                assert(false, `${optionPath}.${optionName}.external should not be used on non script tags`);
            }
        }
        return tagObject;
    });
};

export const getValidatedOptions = (
    options: unknown,
    optionPath: string,
    defaultOptions: Loose = DEFAULT_OPTIONS as unknown as Loose
): ValidatedOptions => {
    assert(isObject(options), `${optionPath} should be an object`);
    const opts = options as Loose;

    const validatedOptions: Loose = {
        ...defaultOptions,
        ...getValidatedMainOptions(opts, optionPath, defaultOptions),
    };

    const globalAppend = validatedOptions.append as boolean | undefined;
    const prependExternals = validatedOptions.prependExternals as boolean | undefined;

    const getAppend = prependExternals
        ? (external: unknown): boolean | undefined => (isDefined(external) ? false : globalAppend)
        : (): boolean | undefined => globalAppend;

    const isTagPrepend = ({append, external}: TagObject): boolean =>
        isDefined(append) ? !append : !getAppend(external);
    const isTagAppend = ({append, external}: TagObject): boolean | undefined =>
        isDefined(append) ? append : getAppend(external);

    const hasTags = isDefined(opts.tags);
    if (hasTags) {
        const tagObjects = getValidatedTagObjects(opts, "tags", optionPath) as TagObject[];
        let [linkObjects, scriptObjects] = splitLinkScriptTags(tagObjects, opts, "tags", optionPath);
        linkObjects = getValidatedTagObjectExternals(linkObjects, false, "tags", optionPath);
        scriptObjects = getValidatedTagObjectExternals(scriptObjects, true, "tags", optionPath);
        validatedOptions.links = linkObjects;
        validatedOptions.scripts = scriptObjects;
    }
    if (isDefined(opts.links)) {
        let linkObjects = getValidatedTagObjects(opts, "links", optionPath) as TagObject[];
        linkObjects = getValidatedTagObjectExternals(linkObjects, false, "links", optionPath);
        validatedOptions.links = hasTags ? (validatedOptions.links as TagObject[]).concat(linkObjects) : linkObjects;
    }
    if (isDefined(opts.scripts)) {
        let scriptObjects = getValidatedTagObjects(opts, "scripts", optionPath) as TagObject[];
        scriptObjects = getValidatedTagObjectExternals(scriptObjects, true, "scripts", optionPath);
        validatedOptions.scripts = hasTags
            ? (validatedOptions.scripts as TagObject[]).concat(scriptObjects)
            : scriptObjects;
    }
    if (isDefined(validatedOptions.links)) {
        validatedOptions.linksPrepend = (validatedOptions.links as TagObject[]).filter(isTagPrepend);
        validatedOptions.linksAppend = (validatedOptions.links as TagObject[]).filter(isTagAppend);
    }
    if (isDefined(validatedOptions.scripts)) {
        validatedOptions.scriptsPrepend = (validatedOptions.scripts as TagObject[]).filter(isTagPrepend);
        validatedOptions.scriptsAppend = (validatedOptions.scripts as TagObject[]).filter(isTagAppend);
    }
    if (isDefined(opts.metas)) {
        let metaObjects = getValidatedMetaObjects(opts, "metas", optionPath) as MetaObject[];
        metaObjects = getValidatedTagObjectExternals(metaObjects, false, "metas", optionPath);
        validatedOptions.metas = metaObjects;
    }

    return validatedOptions as ValidatedOptions;
};

export const getAllValidatedOptions = (options: unknown, optionPath: string): ValidatedOptions & {files?: string[]} => {
    const validatedOptions = getValidatedOptions(options, optionPath);
    let files = (options as Loose).files;
    if (isDefined(files)) {
        assert(isString(files) || isArrayOfString(files), `${optionPath}.files should be a string or array of strings`);
        if (isString(files)) {
            files = [files];
        }
        return {...validatedOptions, files: files as string[]};
    }
    return validatedOptions;
};
