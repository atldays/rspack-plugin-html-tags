import path from "node:path";

// Kept separate from compile.ts so unit specs can reference fixture paths
// without importing @rspack/core (which is ESM-only and heavy).
export const FIXTURES_PATH = path.join(__dirname, "..", "fixtures");
export const FIXTURES_ENTRY = path.join(FIXTURES_PATH, "entry.js");
export const FIXTURES_STYLE = path.join(FIXTURES_PATH, "app.css");
export const EXTERNALS_PATH = path.join(FIXTURES_PATH, "external");
