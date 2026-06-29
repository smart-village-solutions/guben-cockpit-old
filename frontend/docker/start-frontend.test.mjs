import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const binDir = mkdtempSync(join(tmpdir(), "frontend-start-bin-"));

writeFileSync(
  join(binDir, "wget"),
  "#!/bin/sh\nprintf '%s\\n' \"$1\"\nexit 0\n",
  { mode: 0o755 },
);

writeFileSync(join(binDir, "npm"), "#!/bin/sh\nexit 0\n", { mode: 0o755 });
writeFileSync(join(binDir, "node"), "#!/bin/sh\nexit 0\n", { mode: 0o755 });

const output = execFileSync("sh", ["frontend/docker/start-frontend.sh"], {
  cwd: new URL("../..", import.meta.url),
  env: {
    ...process.env,
    PATH: `${binDir}:${process.env.PATH}`,
    INTERNAL_CONTENT_GATEWAY_URL: "http://content-gateway:5100",
    VITE_CONTENT_GATEWAY_URL: "https://cockpit.guben.de",
  },
  encoding: "utf8",
});

assert.match(
  output,
  /Waiting for content gateway at http:\/\/content-gateway:5100\/health/,
  "frontend startup must healthcheck the internal gateway URL before the public browser URL",
);
