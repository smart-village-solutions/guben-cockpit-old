import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const workflow = readFileSync(new URL("./release-prod.yml", import.meta.url), "utf8");

assert.match(
  workflow,
  /IMAGE_NAME:\s*smart-village-solutions\/guben-cockpit/,
  "release images must be published in the smart-village-solutions GHCR namespace",
);

assert.doesNotMatch(
  workflow,
  /context:\s*\.\/(?:frontend|content-gateway)/,
  "release image builds must use the repository root as Docker context",
);

assert.match(
  workflow,
  /context:\s*\.\n\s+file:\s*\.\/frontend\/Dockerfile/,
  "frontend image build must use repo-root context with frontend/Dockerfile",
);

assert.match(
  workflow,
  /context:\s*\.\n\s+file:\s*\.\/content-gateway\/Dockerfile/,
  "content-gateway image build must use repo-root context with content-gateway/Dockerfile",
);
