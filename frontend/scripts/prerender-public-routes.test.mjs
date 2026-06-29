import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const script = readFileSync(new URL("./prerender-public-routes.ts", import.meta.url), "utf8");

assert.match(
  script,
  /process\.env\.PRERENDER_CONTENT_GATEWAY_URL\?\.trim\(\)\s*\|\|/,
  "prerender must prefer PRERENDER_CONTENT_GATEWAY_URL for server-side content fetches",
);

assert.match(
  script,
  /process\.env\.INTERNAL_CONTENT_GATEWAY_URL\?\.trim\(\)\s*\|\|/,
  "prerender must fall back to INTERNAL_CONTENT_GATEWAY_URL before browser-facing URLs",
);

assert.match(
  script,
  /process\.env\.VITE_CONTENT_GATEWAY_URL\?\.trim\(\)\s*\|\|/,
  "prerender may only use VITE_CONTENT_GATEWAY_URL after internal gateway URLs",
);

assert.ok(
  script.indexOf("PRERENDER_CONTENT_GATEWAY_URL") < script.indexOf("INTERNAL_CONTENT_GATEWAY_URL") &&
    script.indexOf("INTERNAL_CONTENT_GATEWAY_URL") < script.indexOf("VITE_CONTENT_GATEWAY_URL"),
  "prerender gateway URL precedence must be PRERENDER, then INTERNAL, then VITE",
);
