# @rspackjs/plugin-html-tags

> Define additional HTML tags — `scripts`, `links`, `metas` — to inject with
> [`HtmlRspackPlugin`](https://rspack.dev/plugins/rspack/html-rspack-plugin).

A self-contained TypeScript rewrite of
[`html-rspack-tags-plugin`](https://github.com/rspack-contrib/html-rspack-tags-plugin)
(itself a fork of [`html-webpack-tags-plugin`](https://github.com/jharris4/html-webpack-tags-plugin)
by Jon Harris). It keeps the same tag-injection behaviour under its own typed
API, published as a dual ESM/CJS package with a `@rspack/core: ^1 || ^2` peer
range, so it installs cleanly alongside **Rspack 2** without `ERESOLVE` errors.

- ✅ Works with **Rspack 1.x and 2.x** (`@rspack/core` peer `^1.0.13 || ^2`).
- ✅ No dependency on `html-webpack-plugin` — hook types come from `@rspack/core`.
- ✅ Strict TypeScript, dual **ESM + CJS** build, ships `.d.ts`.
- ✅ Clean, typed options API (`HtmlTagsPluginOptions`).

## Installation

```bash
npm install -D @rspackjs/plugin-html-tags
```

`@rspack/core` is a peer dependency (you already have it in an Rspack project).
Requires Node `>=22.12`.

## Usage

`HtmlRspackPlugin` must come **before** this plugin in the `plugins` array.

```js
// rspack.config.mjs
import {rspack} from "@rspack/core";
import HtmlTagsRspackPlugin from "@rspackjs/plugin-html-tags";

export default {
  plugins: [
    new rspack.HtmlRspackPlugin(),
    new HtmlTagsRspackPlugin({
      tags: ["a-script.js", "a-style.css"],
      append: true,
    }),
  ],
};
```

CommonJS works too — `require("@rspackjs/plugin-html-tags")` returns the class:

```js
const HtmlTagsRspackPlugin = require("@rspackjs/plugin-html-tags");
```

The named `HtmlTagsPluginOptions` type is exported for TypeScript consumers:

```ts
import type {HtmlTagsPluginOptions} from "@rspackjs/plugin-html-tags";
```

## Examples

### Scripts, links and metas

```js
new HtmlTagsRspackPlugin({
  scripts: [{path: "vendor.js", attributes: {defer: true}}],
  links: [{path: "theme.css", attributes: {media: "screen"}}],
  metas: [{attributes: {name: "theme-color", content: "#222"}}],
});
```

`tags` is a convenience list that is split into links/scripts by file
extension (`.css` → link, `.js` → script), or by an explicit `type: "css" | "js"`.

### Scoping injection to specific HTML files (`files`)

When multiple `HtmlRspackPlugin` instances emit different HTML files, restrict a
tag set to specific outputs (matched with [minimatch](https://github.com/isaacs/minimatch)):

```js
new HtmlTagsRspackPlugin({
  files: ["index.html"],
  tags: ["only-on-index.js"],
});
```

### Hash and public path

```js
new HtmlTagsRspackPlugin({
  tags: ["app.js"],
  hash: true, // append `?<compilation hash>` — also accepts a string or (assetPath, hash) => string
  publicPath: "https://cdn.example.com/", // prefix — also accepts true/false or (assetPath, publicPath) => string
});
```

`publicPath` is applied first, then `hash`. Both can be overridden per-tag.

### Globbing files into tags

```js
new HtmlTagsRspackPlugin({
  links: [{path: "assets", globPath: "src/icons", glob: "*.css", globFlatten: false}],
});
```

### Copying a source file into the output (`sourcePath`)

```js
new HtmlTagsRspackPlugin({
  links: [{path: "favicon.ico", sourcePath: "src/favicon.ico", attributes: {rel: "icon"}}],
});
```

### Externals (scripts only)

Registers the package as a webpack/rspack external and injects its script tag:

```js
new HtmlTagsRspackPlugin({
  scripts: [
    {
      path: "https://unpkg.com/react/umd/react.production.min.js",
      external: {packageName: "react", variableName: "React"},
    },
  ],
});
```

## Options

All options are optional.

| Option                                           | Type                        | Default    | Description                                                               |
| ------------------------------------------------ | --------------------------- | ---------- | ------------------------------------------------------------------------- |
| `append`                                         | `boolean`                   | `true`     | Inject after (`true`) or before (`false`) the bundle's own tags.          |
| `prependExternals`                               | `boolean`                   | `true`     | Force `external` scripts to be prepended (so dependents load after them). |
| `tags`                                           | `string \| object \| Array` | —          | Mixed tags, split into links/scripts by extension or `type`.              |
| `links`                                          | `string \| object \| Array` | —          | Link tag(s).                                                              |
| `scripts`                                        | `string \| object \| Array` | —          | Script tag(s) (support `external`).                                       |
| `metas`                                          | `object \| Array`           | —          | Meta tag(s) (require an `attributes` object).                             |
| `files`                                          | `string \| string[]`        | —          | Only inject into HTML outputs matching these minimatch patterns.          |
| `useHash` / `addHash` / `hash`                   | see below                   | —          | Append a hash query to asset paths.                                       |
| `usePublicPath` / `addPublicPath` / `publicPath` | see below                   | —          | Prefix asset paths with a public path.                                    |
| `jsExtensions`                                   | `string \| string[]`        | `[".js"]`  | Extensions treated as scripts when splitting `tags`.                      |
| `cssExtensions`                                  | `string \| string[]`        | `[".css"]` | Extensions treated as links when splitting `tags`.                        |

Per-tag options (`LinkTagOptions` / `ScriptTagOptions` / `MetaTagOptions`): `path`,
`attributes`, `glob`, `globPath`, `globFlatten`, `sourcePath`, plus the
`append`/`hash`/`publicPath` shortcuts (which override the top-level value), and
`external` (scripts only).

- `hash`: `true` uses the default `(assetPath) => assetPath + "?" + hash`; a
  `string` is used as the hash; a function `(assetPath, hash) => string` fully
  customizes it. `useHash`/`addHash` are the explicit boolean/function pair.
- `publicPath`: `true` uses the compilation public path; a `string` is used as
  the prefix; a function `(assetPath, publicPath) => string` fully customizes
  it. `usePublicPath`/`addPublicPath` are the explicit pair.

## Compatibility

- **Rspack**: `@rspack/core` `^1.0.13 || ^2`. The plugin taps
  `HtmlRspackPlugin.getCompilationHooks(compilation)`
  (`beforeAssetTagGeneration` and `alterAssetTagGroups`), which exists in both
  major versions.
- **Webpack**: not supported. This is an Rspack-only plugin; for webpack use the
  original [`html-webpack-tags-plugin`](https://github.com/jharris4/html-webpack-tags-plugin).

### Differences from `html-rspack-tags-plugin`

- Renamed exports: the class is `HtmlTagsRspackPlugin` (was `HtmlRspackTagsPlugin`)
  and the options type is `HtmlTagsPluginOptions` (was `Options`).
- Removed the `html-webpack-plugin` peer dependency and the `htmlPluginName`
  option / `getHooks` fallback — this package targets `HtmlRspackPlugin` only.
- Rewritten in TypeScript; published as dual ESM + CJS with type declarations.
- The "no html plugin" error message now references `HtmlRspackPlugin`.

The option fields and runtime behaviour are otherwise unchanged from the original.

## Credits

- Original [`html-webpack-tags-plugin`](https://github.com/jharris4/html-webpack-tags-plugin) by **Jon Harris**.
- [`html-rspack-tags-plugin`](https://github.com/rspack-contrib/html-rspack-tags-plugin) fork by **rspack-contrib**.

## License

[MIT](./LICENSE) — original copyright © 2016 Jon Harris, fork © rspack-contrib,
this rewrite © 2026 Anjey Tsibylskij.
