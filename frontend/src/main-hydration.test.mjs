import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const entrypoint = readFileSync(new URL("./main.tsx", import.meta.url), "utf8");

assert.match(
  entrypoint,
  /hydrateRoot/,
  "React entrypoint must hydrate prerendered markup instead of leaving the static shell in place",
);

assert.doesNotMatch(
  entrypoint,
  /if\s*\(\s*!rootElement\.innerHTML\s*\)/,
  "React entrypoint must not skip mounting when prerendered markup exists",
);

assert.match(
  entrypoint,
  /rootElement\.hasChildNodes\(\)/,
  "React entrypoint should choose hydration when the app container already has prerendered children",
);
