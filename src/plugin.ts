import type {Compilation, Compiler} from "@rspack/core";
import {getAllValidatedOptions, getValidatedMainOptions, getValidatedOptions} from "./options/validate";
import {IS} from "./options/guards";
import {getShouldSkip} from "./files";
import {registerExternals} from "./externals";
import {createBeforeAssetTagGeneration, type SharedState} from "./hooks/before-asset-tag-generation";
import {createAlterAssetTagGroups} from "./hooks/alter-asset-tag-groups";
import type {HtmlRspackPluginHooks, HtmlTagsPluginOptions, TagObject, ValidatedOptions} from "./types";

const PLUGIN_NAME = "HtmlTagsRspackPlugin";
const TAP_NAME = "htmlTagsRspackPlugin";

export class HtmlTagsRspackPlugin {
    /**
     * Internal validation helpers, exposed for backwards compatibility with the
     * original `.api` surface. Not part of the supported public API.
     * @internal
     */
    static api = {IS, getValidatedOptions, getValidatedMainOptions};

    private readonly options: ValidatedOptions & {files?: string[]};

    constructor(options: HtmlTagsPluginOptions = {}) {
        this.options = getAllValidatedOptions(options, PLUGIN_NAME + ".options");
    }

    apply(compiler: Compiler): void {
        const options = this.options;
        const shouldSkip = getShouldSkip(options.files);
        const scripts = (options.scripts ?? []) as TagObject[];

        registerExternals(compiler, scripts);

        compiler.hooks.compilation.tap(TAP_NAME, (compilation: Compilation) => {
            const HtmlRspackPlugin = compiler.webpack.HtmlRspackPlugin;

            const htmlPlugins = compilation.options.plugins.filter(plugin => plugin instanceof HtmlRspackPlugin);
            if (htmlPlugins.length === 0) {
                throw new Error(
                    "Error running HtmlTagsRspackPlugin, are you sure you have HtmlRspackPlugin before it in your rspack config's plugins?"
                );
            }

            const hooks = HtmlRspackPlugin.getCompilationHooks(compilation) as unknown as HtmlRspackPluginHooks;

            // Shared between the two hooks for this compilation so that meta tag
            // paths reuse the publicPath captured during asset tag generation.
            const state: SharedState = {publicPath: ""};

            hooks.beforeAssetTagGeneration.tapAsync(
                TAP_NAME,
                createBeforeAssetTagGeneration(options, shouldSkip, state, compilation)
            );
            hooks.alterAssetTagGroups.tapAsync(
                TAP_NAME,
                createAlterAssetTagGroups(options, shouldSkip, state, compilation)
            );
        });
    }
}
