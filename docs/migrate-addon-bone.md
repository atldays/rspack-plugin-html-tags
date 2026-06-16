# Migrating addon-bone to `@rspackjs/plugin-html-tags`

This is a drop-in replacement for `html-rspack-tags-plugin`. The public `Options`
type and runtime behaviour are unchanged, so the migration is purely mechanical:
swap the dependency and update the import specifier everywhere.

addon-bone repo: `/Users/anjeytsibylskij/Documents/AddonStack/addon-bone`.

## 1. Swap the dependency

In `package.json`:

```diff
-    "html-rspack-tags-plugin": "^0.0.3",
+    "@rspackjs/plugin-html-tags": "^1.0.0",
```

Then reinstall. This resolves the `ERESOLVE` error: the new package declares
`@rspack/core: "^1.0.13 || ^2"`, compatible with addon-bone's `@rspack/core@^2`,
and no longer pulls a `html-webpack-plugin@^5` peer.

## 2. Update the default (class) imports

Replace `from "html-rspack-tags-plugin"` with `from "@rspackjs/plugin-html-tags"`
in every file that constructs the plugin:

- `src/cli/plugins/html.ts`
- `src/cli/plugins/popup/index.ts`
- `src/cli/plugins/sidebar/index.ts`
- `src/cli/plugins/page/index.ts`
- `src/cli/plugins/sandbox/index.ts`
- `src/cli/plugins/offscreen/index.ts`

```diff
-import HtmlRspackTagsPlugin from "html-rspack-tags-plugin";
+import HtmlRspackTagsPlugin from "@rspackjs/plugin-html-tags";
```

The default export is still the plugin class — `new HtmlRspackTagsPlugin(options)`
works unchanged (both ESM `import` and CJS `require` return the class).

## 3. Update the type imports

Replace the `Options` type import in:

- `src/types/view.ts`
- `src/types/config.ts`
- `src/cli/plugins/view/View.ts`

```diff
-import type {Options as HtmlOptions} from "html-rspack-tags-plugin";
+import type {Options as HtmlOptions} from "@rspackjs/plugin-html-tags";
```

## 4. Verify the `Options` type still fits `ViewOptions`

`src/types/view.ts` does:

```ts
export type ViewOptions = ViewConfig & EntrypointOptions & ExcludeFunctionsFromProperties<HtmlOptions>;
```

`Options` is preserved 1:1 (same fields: `append`, `prependExternals`,
`useHash`/`addHash`/`hash`, `usePublicPath`/`addPublicPath`/`publicPath`,
`jsExtensions`, `cssExtensions`, `files`, `tags`, `links`, `scripts`, `metas`, and
the same `LinkTagOptions`/`ScriptTagOptions`/`MetaTagOptions` shapes), so
`ExcludeFunctionsFromProperties<HtmlOptions>` resolves identically — no changes
needed in the view config surface.

`View.tags()` (which spreads view options and adds `files: [filename]`) keeps
working unchanged, because `files` and per-tag `attributes`/`tags`/`links`/
`scripts`/`metas` are all still supported.

## 5. Validate

```bash
npm install      # no ERESOLVE on @rspack/core@2
npm run build
npm test
```

Build a sample extension and confirm the popup/sidebar/page/offscreen/sandbox
HTML still contains the injected tags/attributes as before.

## Notes / intentional differences

- This package targets `HtmlRspackPlugin` only (the `html-webpack-plugin` peer
  and the internal `htmlPluginName` option were removed). addon-bone already
  uses `HtmlRspackPlugin`, so this has no effect.
- The "no html plugin in config" error message now references `HtmlRspackPlugin`
  instead of `html-webpack-plugin`.
