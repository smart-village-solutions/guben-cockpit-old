import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { once } from "node:events";

let directory;
let gateway;
let frontend;
let baseUrl;
const calls = [];
const statuses = new Map([["valid", 200], ["expired", 404], ["changing", 200]]);

before(async () => {
  directory = await mkdtemp(path.join(tmpdir(), "cockpit-http-status-"));
  for (const [file, body] of [
    ["index.html", "ROOT-FALLBACK"],
    ["events/index.html", "EVENT-LIST"],
    ["events/valid/index.html", "VALID-EVENT"],
    ["events/expired/index.html", "STALE-EXPIRED-EVENT"],
    ["projects/index.html", "PROJECT-OVERVIEW"],
    ["projects/237/index.html", "STALE-LEGACY-PROJECT"],
    ["projects/featured:5553/index.html", "CURRENT-FEATURED-PROJECT"],
    ["projects/poi:123/index.html", "CURRENT-POI"],
    ["assets/app.js", "STATIC-ASSET"],
  ]) {
    const destination = path.join(directory, "dist", file);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, body);
  }
  gateway = createServer((request, response) => {
    calls.push({ url: request.url, language: request.headers["accept-language"] });
    const url = new URL(request.url, "http://gateway");
    const id = url.pathname.split("/").at(-1);
    if (id === "disconnect") return request.socket.destroy();
    if (id === "slow") return;
    const status = id === "unavailable" ? 503 : statuses.get(id) ?? 404;
    response.writeHead(status, { "content-type": "application/json" });
    response.end(JSON.stringify(status === 200 ? { event: { id } } : { error: { code: "NOT_FOUND" } }));
  });
  gateway.listen(0, "127.0.0.1");
  await once(gateway, "listening");
  frontend = spawn(process.execPath, [fileURLToPath(new URL("./serve-dist.mjs", import.meta.url))], {
    cwd: directory,
    env: { ...process.env, PORT: "0", INTERNAL_CONTENT_GATEWAY_URL: `http://127.0.0.1:${gateway.address().port}` },
    stdio: ["ignore", "pipe", "pipe"],
  });
  baseUrl = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Frontend did not start")), 5000);
    frontend.once("error", reject);
    frontend.once("exit", (code) => reject(new Error(`Frontend exited with ${code}`)));
    frontend.stdout.on("data", (chunk) => {
      const match = chunk.toString().match(/http:\/\/0\.0\.0\.0:(\d+)/);
      if (match) {
        clearTimeout(timeout);
        resolve(`http://127.0.0.1:${match[1]}`);
      }
    });
  });
});

after(async () => {
  if (frontend && frontend.exitCode === null) {
    const exited = once(frontend, "exit");
    frontend.kill();
    await exited;
  }
  gateway?.closeAllConnections();
  if (gateway?.listening) await new Promise((resolve) => gateway.close(resolve));
  if (directory) await rm(directory, { recursive: true, force: true });
});

test("valid GET and HEAD preserve the existing event page", async () => {
  for (const method of ["GET", "HEAD"]) {
    const response = await fetch(`${baseUrl}/events/valid`, { method });
    assert.equal(response.status, 200);
    assert.equal(await response.text(), method === "HEAD" ? "" : "VALID-EVENT");
  }
});

test("a stale prerendered event returns HTML 404 for GET and HEAD", async () => {
  for (const method of ["GET", "HEAD"]) {
    const response = await fetch(`${baseUrl}/events/expired/`, { method });
    assert.equal(response.status, 404);
    assert.match(response.headers.get("content-type"), /text\/html/);
    assert.equal(response.headers.get("x-robots-tag"), "noindex");
    assert.equal(response.headers.get("cache-control"), "no-store");
    const body = await response.text();
    if (method === "HEAD") assert.equal(body, "");
    else {
      assert.match(body, /Veranstaltung nicht mehr verfügbar/);
      assert.match(body, /href="\/events"/);
      assert.doesNotMatch(body, /STALE-EXPIRED-EVENT|ROOT-FALLBACK|<script/);
    }
  }
});

test("an unknown event cannot fall back to the homepage with HTTP 200", async () => {
  const response = await fetch(`${baseUrl}/events/unknown`);
  assert.equal(response.status, 404);
  assert.doesNotMatch(await response.text(), /ROOT-FALLBACK/);
});

test("gateway errors and network failures return temporary HTML 503", async () => {
  for (const id of ["unavailable", "disconnect"]) {
    const response = await fetch(`${baseUrl}/events/${id}`);
    assert.equal(response.status, 503);
    assert.equal(response.headers.get("retry-after"), "60");
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.match(await response.text(), /vorübergehend nicht erreichbar/);
  }
});

test("a gateway timeout is temporary unavailability, not a missing event", { timeout: 15_000 }, async () => {
  const response = await fetch(`${baseUrl}/events/slow`);
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("retry-after"), "60");
});

test("a subsequently removed event is checked again rather than cached as valid", async () => {
  let response = await fetch(`${baseUrl}/events/changing`);
  assert.equal(response.status, 200);
  await response.text();
  statuses.set("changing", 404);
  response = await fetch(`${baseUrl}/events/changing`);
  assert.equal(response.status, 404);
});

test("event lookup preserves encoded IDs and the requested language", async () => {
  await fetch(`${baseUrl}/events/123:2026-11-08:17%3A00?lang=pl`, {
    headers: { "accept-language": "pl" },
  });
  assert.ok(calls.some((call) => call.url === "/api/content/events/123:2026-11-08:17%3A00?lang=pl" && call.language === "pl"));
});

test("the event list and static assets do not trigger detail checks", async () => {
  const previousCalls = calls.length;
  for (const [url, expected] of [["/events", "EVENT-LIST"], ["/assets/app.js", "STATIC-ASSET"]]) {
    const response = await fetch(baseUrl + url);
    assert.equal(response.status, 200);
    assert.equal(await response.text(), expected);
  }
  assert.equal(calls.length, previousCalls);
});

test("the existing JSON gateway proxy retains its response status", async () => {
  const response = await fetch(`${baseUrl}/api/content/events/unknown`);
  assert.equal(response.status, 404);
  assert.match(response.headers.get("content-type"), /application\/json/);
});

test("numeric legacy project pages redirect to the overview for GET and HEAD", async () => {
  const previousCalls = calls.length;
  for (const path of ["/projects/237", "/projects/238/", "/projects/553?lang=pl", "/projects/999999"]) {
    for (const method of ["GET", "HEAD"]) {
      const response = await fetch(baseUrl + path, { method, redirect: "manual" });
      assert.equal(response.status, 302);
      assert.equal(response.headers.get("location"), "/projects");
      assert.equal(response.headers.get("cache-control"), "no-store");
      assert.doesNotMatch(await response.text(), /STALE-LEGACY-PROJECT|ROOT-FALLBACK/);
    }
  }
  assert.equal(calls.length, previousCalls, "Legacy redirects must not call the detail API");
});

test("a legacy link reaches the functioning project overview", async () => {
  const response = await fetch(`${baseUrl}/projects/237`);
  assert.equal(response.status, 200);
  assert.equal(response.url, `${baseUrl}/projects`);
  assert.equal(await response.text(), "PROJECT-OVERVIEW");
});

test("current project IDs and the reserved school/marketplace routes retain their behavior", async () => {
  for (const [url, body] of [
    ["/projects", "PROJECT-OVERVIEW"],
    ["/projects/featured%3A5553", "CURRENT-FEATURED-PROJECT"],
    ["/projects/poi%3A123", "CURRENT-POI"],
    ["/projects/schools", "ROOT-FALLBACK"],
    ["/projects/marketplace", "ROOT-FALLBACK"],
  ]) {
    const response = await fetch(baseUrl + url, { redirect: "manual" });
    assert.equal(response.status, 200);
    assert.equal(await response.text(), body);
  }
});
