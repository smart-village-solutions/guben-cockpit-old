import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, "..");
const postgresImage = "postgres:16-alpine";
const postgrestImage = "postgrest/postgrest:v12.2.8";

const dockerAvailable = spawnSync("docker", ["version"], { stdio: "ignore" }).status === 0;
const suffix = randomUUID().slice(0, 8);
const networkName = `guben-postgrest-test-${suffix}`;
const postgresContainer = `guben-postgres-test-${suffix}`;
const postgrestContainer = `guben-postgrest-test-${suffix}`;
const dbUri = "postgres://guben:VeryStrongPassword123@postgres-test:5432/guben";
const port = 36000 + Number.parseInt(suffix.slice(0, 3), 16);

const run = (args, options = {}) => {
  const result = spawnSync("docker", args, {
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
    ...options,
  });

  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || `docker ${args.join(" ")} failed`).trim());
  }

  return result.stdout.trim();
};

const inspectContainerStatus = (containerName) =>
  spawnSync(
    "docker",
    ["inspect", containerName, "--format", "{{.State.Status}}"],
    { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
  ).stdout.trim();

const ensureContainerRunning = async (containerName) => {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const status = inspectContainerStatus(containerName);

    if (status === "running") {
      return;
    }

    if (status === "created" || status === "exited") {
      spawnSync("docker", ["start", containerName], { stdio: "ignore" });
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`Timed out waiting for container ${containerName} to start`);
};

const resolvePackageFile = (...segments) => {
  const resolved = path.join(packageRoot, ...segments);

  if (!existsSync(resolved)) {
    throw new Error(`Could not resolve ${segments.join("/")} from ${packageRoot}`);
  }

  return resolved;
};

const waitForHttp = (url) => {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      return execFileSync("curl", ["-fsS", url], { encoding: "utf8" }).trim();
    } catch {}

    execFileSync("sleep", ["1"]);
  }

  throw new Error(`Timed out waiting for ${url}`);
};

const waitForPostgres = async () => {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const ready = spawnSync(
      "docker",
      [
        "exec",
        postgresContainer,
        "psql",
        "-U",
        "guben",
        "-d",
        "guben",
        "-c",
        "SELECT 1",
      ],
      { stdio: "ignore" },
    );

    if (ready.status === 0) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error("Timed out waiting for PostgreSQL");
};

const execPsql = (sql) =>
  run([
    "exec",
    "-i",
    postgresContainer,
    "psql",
    "-U",
    "guben",
    "-d",
    "guben",
    "-v",
    "ON_ERROR_STOP=1",
    "-c",
    sql,
  ]);

const execPsqlFile = (filePath) =>
  run(
    [
      "exec",
      "-i",
      postgresContainer,
      "psql",
      "-U",
      "guben",
      "-d",
      "guben",
      "-v",
      "ON_ERROR_STOP=1",
      "-f",
      "-",
    ],
    {
      input: readFileSync(filePath, "utf8"),
    },
  );

const setupSeedData = () => {
  execPsql(`
    CREATE SCHEMA IF NOT EXISTS "Guben";

    CREATE TABLE IF NOT EXISTS "Guben"."Page" (
      "Id" text PRIMARY KEY,
      "Translations" jsonb NOT NULL
    );
    CREATE TABLE IF NOT EXISTS "Guben"."Project" (
      "Id" text PRIMARY KEY,
      "Type" integer NOT NULL,
      "Title" text NOT NULL,
      "ImageCaption" text,
      "ImageUrl" text,
      "ImageCredits" text,
      "Published" boolean NOT NULL,
      "Deleted" boolean NOT NULL,
      "Translations" jsonb NOT NULL
    );
    CREATE TABLE IF NOT EXISTS "Guben"."Location" (
      "Id" text PRIMARY KEY,
      "City" text,
      "Street" text,
      "TelephoneNumber" text,
      "Fax" text,
      "Email" text,
      "Website" text,
      "Zip" text,
      "Translations" jsonb NOT NULL
    );
    CREATE TABLE IF NOT EXISTS "Guben"."Event" (
      "Id" text PRIMARY KEY,
      "EventId" text NOT NULL,
      "TerminId" text NOT NULL,
      "StartDate" timestamptz NOT NULL,
      "EndDate" timestamptz NOT NULL,
      "Published" boolean NOT NULL,
      "Deleted" boolean NOT NULL,
      "LocationId" text NOT NULL,
      "Coordinates" text,
      "Translations" jsonb NOT NULL
    );
    CREATE TABLE IF NOT EXISTS "Guben"."Category" (
      "Id" text PRIMARY KEY,
      "Name" text NOT NULL
    );
    CREATE TABLE IF NOT EXISTS "Guben"."EventCategory" (
      "EventsId" text NOT NULL,
      "CategoriesId" text NOT NULL
    );
    CREATE TABLE IF NOT EXISTS "Guben"."Url" (
      "Id" integer PRIMARY KEY,
      "EventId" text NOT NULL,
      "Link" text NOT NULL,
      "Description" text NOT NULL
    );
    CREATE TABLE IF NOT EXISTS "Guben"."EventImages" (
      "EventId" text NOT NULL,
      "OriginalUrl" text NOT NULL,
      "PreviewUrl" text NOT NULL,
      "ThumbnailUrl" text NOT NULL
    );
    CREATE TABLE IF NOT EXISTS "Guben"."DashboardDropdown" (
      "Id" text PRIMARY KEY,
      "Rank" integer NOT NULL,
      "IsLink" boolean NOT NULL,
      "Translations" jsonb NOT NULL
    );
    CREATE TABLE IF NOT EXISTS "Guben"."DashboardTab" (
      "Id" text PRIMARY KEY,
      "DropdownId" text,
      "Sequence" integer NOT NULL,
      "MapUrl" text NOT NULL,
      "Translations" jsonb NOT NULL
    );
    CREATE TABLE IF NOT EXISTS "Guben"."InformationCard" (
      "Id" text PRIMARY KEY,
      "DashboardTabId" text NOT NULL,
      "Sequenece" integer NOT NULL,
      "ImageUrl" text,
      "Translations" jsonb NOT NULL,
      "Button_Translations" jsonb,
      "Button_OpenInNewTab" boolean
    );
    CREATE TABLE IF NOT EXISTS "Guben"."DropdownLink" (
      "Id" text PRIMARY KEY,
      "DropdownId" text NOT NULL,
      "Link" text NOT NULL,
      "Sequence" integer NOT NULL,
      "Translations" jsonb NOT NULL
    );
    CREATE TABLE IF NOT EXISTS "Guben"."FooterItem" (
      "Id" text PRIMARY KEY,
      "Name" text NOT NULL,
      "Content" text NOT NULL
    );
    CREATE TABLE IF NOT EXISTS "Guben"."Booking" (
      "Id" text PRIMARY KEY,
      "TenantId" text NOT NULL,
      "ForPublicUse" boolean NOT NULL
    );
    CREATE TABLE IF NOT EXISTS "Guben"."User" (
      "Id" text PRIMARY KEY
    );

    INSERT INTO "Guben"."Page" ("Id", "Translations")
    VALUES ('Home', '{"de":{"Title":"Startseite","Description":"Beschreibung"}}')
    ON CONFLICT ("Id") DO NOTHING;
    INSERT INTO "Guben"."FooterItem" ("Id", "Name", "Content")
    VALUES ('footer-1', 'Impressum', '<p>Inhalt</p>')
    ON CONFLICT ("Id") DO NOTHING;
    INSERT INTO "Guben"."Booking" ("Id", "TenantId", "ForPublicUse")
    VALUES ('booking-1', 'tenant-public', TRUE)
    ON CONFLICT ("Id") DO NOTHING;
    INSERT INTO "Guben"."User" ("Id")
    VALUES ('user-1')
    ON CONFLICT ("Id") DO NOTHING;
  `);
};

describe("postgrest smoke", { skip: !dockerAvailable, timeout: 60000 }, () => {
  before(async () => {
    run(["network", "create", networkName]);
    run([
      "create",
      "--name",
      postgresContainer,
      "--network",
      networkName,
      "--network-alias",
      "postgres-test",
      "-e",
      "POSTGRES_USER=guben",
      "-e",
      "POSTGRES_PASSWORD=VeryStrongPassword123",
      "-e",
      "POSTGRES_DB=guben",
      postgresImage,
    ]);

    run(["start", postgresContainer]);
    await ensureContainerRunning(postgresContainer);
    await waitForPostgres();
    setupSeedData();

    const sqlFiles = [
      resolvePackageFile("sql", "001_create_role.sql"),
      resolvePackageFile("sql", "002_create_schema_and_views.sql"),
      resolvePackageFile("sql", "003_grants.sql"),
      resolvePackageFile("checks", "verify_permissions.sql"),
    ];

    for (let pass = 0; pass < 2; pass += 1) {
      for (const filePath of sqlFiles) {
        execPsqlFile(filePath);
      }
    }

    run([
      "create",
      "--name",
      postgrestContainer,
      "--network",
      networkName,
      "-p",
      `${port}:3000`,
      "-e",
      `PGRST_DB_URI=${dbUri}`,
      "-e",
      "PGRST_DB_SCHEMAS=public_content",
      "-e",
      "PGRST_DB_ANON_ROLE=guben_public_content_reader",
      "-e",
      "PGRST_OPENAPI_MODE=follow-privileges",
      "-e",
      "PGRST_DB_ROOT_SPEC=false",
      "-e",
      "PGRST_SERVER_PORT=3000",
      postgrestImage,
    ]);

    run(["start", postgrestContainer]);
    await ensureContainerRunning(postgrestContainer);
  });

  after(() => {
    spawnSync("docker", ["rm", "-f", postgrestContainer], { stdio: "ignore" });
    spawnSync("docker", ["rm", "-f", postgresContainer], { stdio: "ignore" });
    spawnSync("docker", ["network", "rm", networkName], { stdio: "ignore" });
  });

  it(
    "applies the bootstrap idempotently and exposes only the public content surface",
    { timeout: 60000 },
    () => {
      const pages = JSON.parse(waitForHttp(`http://127.0.0.1:${port}/pages?select=id`));
      assert.deepEqual(pages, [{ id: "Home" }]);

      const footerRows = JSON.parse(waitForHttp(`http://127.0.0.1:${port}/footer_items?select=id,name`));
      assert.deepEqual(footerRows, [{ id: "footer-1", name: "Impressum" }]);

      const deniedStatus = execFileSync(
        "sh",
        ["-lc", `curl -s -o /dev/null -w '%{http_code}' 'http://127.0.0.1:${port}/User?select=Id'`],
        { encoding: "utf8" },
      ).trim();
      assert.equal(deniedStatus, "404");

      const readerCheck = execPsql(`
        SET ROLE guben_public_content_reader;
        SELECT tenant_id FROM public_content.booking_tenants;
        RESET ROLE;
      `);
      assert.match(readerCheck, /tenant-public/);
    },
  );
});
