import { readFile } from "node:fs/promises";
import path from "node:path";

const distDir = path.resolve(process.cwd(), "dist");

const assertContains = async (relativePath: string, expected: RegExp) => {
  const html = await readFile(path.join(distDir, relativePath), "utf8");
  if (!expected.test(html)) {
    throw new Error(`Expected ${relativePath} to match ${expected}`);
  }
};

const main = async () => {
  await assertContains("index.html", /data-prerendered="true"/);
  await assertContains("index.html", /<meta name="description"/);
  await assertContains("projects/index.html", /Featured Projects/);
  await assertContains("events/index.html", /Veranstaltungen/);
  await assertContains("map/index.html", /Karte öffnen/);
};

void main();
