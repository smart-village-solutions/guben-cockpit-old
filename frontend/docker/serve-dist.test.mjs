import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "node:http";

const listen = (server, port = 0) =>
  new Promise((resolve) => {
    server.listen(port, "127.0.0.1", () => resolve(server.address().port));
  });

const waitForHttp = async (url) => {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // keep waiting
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for ${url}`);
};

const gatewayServer = createServer((request, response) => {
  if (request.url?.startsWith("/api/content/home")) {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ proxied: true, path: request.url }));
    return;
  }

  response.writeHead(404, { "content-type": "application/json" });
  response.end(JSON.stringify({ error: "not found" }));
});

const gatewayPort = await listen(gatewayServer);

const workDir = mkdtempSync(join(tmpdir(), "serve-dist-"));
mkdirSync(join(workDir, "dist"), { recursive: true });
writeFileSync(join(workDir, "dist", "index.html"), "<!doctype html><div>fallback shell</div>");

const webPort = 39000 + Math.floor(Math.random() * 1000);
const webServer = spawn(process.execPath, [new URL("./serve-dist.mjs", import.meta.url).pathname], {
  cwd: workDir,
  env: {
    ...process.env,
    PORT: String(webPort),
    INTERNAL_CONTENT_GATEWAY_URL: `http://127.0.0.1:${gatewayPort}`,
  },
  stdio: ["ignore", "pipe", "pipe"],
});

try {
  await waitForHttp(`http://127.0.0.1:${webPort}/`);

  const response = await fetch(`http://127.0.0.1:${webPort}/api/content/home?lang=de`);
  const body = await response.text();

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /application\/json/);
  assert.deepEqual(JSON.parse(body), {
    proxied: true,
    path: "/api/content/home?lang=de",
  });
} finally {
  webServer.kill();
  gatewayServer.close();
}
