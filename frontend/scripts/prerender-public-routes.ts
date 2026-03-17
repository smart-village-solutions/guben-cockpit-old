import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  eventDetailContentSchema,
  eventsContentSchema,
  footerContentSchema,
  homeContentSchema,
  mapContentSchema,
  projectsContentSchema,
} from "../../shared/public-content/contracts";

const baseUrl = process.env.VITE_CONTENT_GATEWAY_URL?.trim() || "http://localhost:5100";
const distDir = path.resolve(process.cwd(), "dist");

const fetchJson = async <T>(pathName: string, schema: { parse(input: unknown): T }) => {
  const response = await fetch(`${baseUrl}${pathName}`);
  if (!response.ok) {
    throw new Error(`Prerender fetch failed for ${pathName} with status ${response.status}`);
  }

  return schema.parse(await response.json());
};

const ensureDirectory = async (filePath: string) => {
  await mkdir(path.dirname(filePath), { recursive: true });
};

const injectMetadata = (template: string, metadata: { title: string; description: string; canonical: string; indexable: boolean }) =>
  template
    .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(metadata.title)}</title>`)
    .replace(
      "</head>",
      [
        `<meta name="description" content="${escapeHtml(metadata.description)}" />`,
        `<meta name="robots" content="${metadata.indexable ? "index,follow" : "noindex,nofollow"}" />`,
        `<link rel="canonical" href="${escapeHtml(metadata.canonical)}" />`,
        "</head>",
      ].join(""),
    );

const injectBody = (template: string, markup: string) =>
  template
    .replace('<div id="root"></div>', `<div id="root">${markup}</div>`)
    .replace('<div id="app"></div>', `<div id="app">${markup}</div>`);

const pageShell = (title: string, description: string, content: string) => `
  <main data-prerendered="true" class="prerender-shell">
    <section>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(description)}</p>
    </section>
    ${content}
  </main>
`;

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const renderHome = async (template: string) => {
  const home = await fetchJson("/api/content/home", homeContentSchema);
  const footer = await fetchJson("/api/content/footer", footerContentSchema);

  const markup = pageShell(
    home.page.title,
    home.page.description,
    `
      <section>
        <h2>Dashboard</h2>
        <ul>
          ${home.dashboard.dropdowns
            .map((dropdown) => `<li>${escapeHtml(dropdown.title)}</li>`)
            .join("")}
        </ul>
      </section>
      <footer>
        ${footer.items.map((item) => `<div>${escapeHtml(item.name)}</div>`).join("")}
      </footer>
    `,
  );

  return injectBody(injectMetadata(template, home.seo), markup);
};

const renderProjects = async (template: string) => {
  const projects = await fetchJson("/api/content/projects?pageNumber=1&pageSize=12", projectsContentSchema);
  const markup = pageShell(
    projects.page.title,
    projects.page.description,
    `
      <section>
        <h2>Featured Projects</h2>
        <ul>${projects.featuredProjects
          .map((project) => `<li>${escapeHtml(project.title)}</li>`)
          .join("")}</ul>
      </section>
      <section>
        <h2>Schools</h2>
        <ul>${projects.schools.map((project) => `<li>${escapeHtml(project.title)}</li>`).join("")}</ul>
      </section>
      <section>
        <h2>Marktplatz</h2>
        <ul>${projects.businesses.results
          .map((project) => `<li>${escapeHtml(project.title)}</li>`)
          .join("")}</ul>
      </section>
    `,
  );

  return injectBody(injectMetadata(template, projects.seo), markup);
};

const renderEvents = async (template: string) => {
  const events = await fetchJson("/api/content/events?pageNumber=1&pageSize=25", eventsContentSchema);
  const markup = pageShell(
    events.page.title,
    events.page.description,
    `
      <section>
        <h2>Veranstaltungen</h2>
        <ul>${events.events.results
          .map((event) => `<li>${escapeHtml(event.title)} - ${escapeHtml(event.location.name)}</li>`)
          .join("")}</ul>
      </section>
    `,
  );

  return {
    html: injectBody(injectMetadata(template, events.seo), markup),
    eventIds: events.events.results.map((event) => event.id),
  };
};

const renderEventDetail = async (template: string, eventId: string) => {
  const event = await fetchJson(`/api/content/events/${eventId}`, eventDetailContentSchema);
  const markup = pageShell(
    event.event.title,
    event.event.description,
    `
      <section>
        <h2>${escapeHtml(event.event.location.name)}</h2>
        <p>${escapeHtml(event.event.startDate)}</p>
        <p>${escapeHtml(event.event.description)}</p>
      </section>
    `,
  );

  return injectBody(injectMetadata(template, event.seo), markup);
};

const renderMap = async (template: string) => {
  const map = await fetchJson("/api/content/map", mapContentSchema);
  const markup = pageShell(
    map.page.title,
    map.page.description,
    `<section><a href="${escapeHtml(map.map.embedUrl)}">Karte öffnen</a></section>`,
  );

  return injectBody(injectMetadata(template, map.seo), markup);
};

const main = async () => {
  const template = await readFile(path.join(distDir, "index.html"), "utf8");

  await writeFile(path.join(distDir, "index.html"), await renderHome(template), "utf8");

  await ensureDirectory(path.join(distDir, "projects/index.html"));
  await writeFile(path.join(distDir, "projects/index.html"), await renderProjects(template), "utf8");

  const eventsRender = await renderEvents(template);
  await ensureDirectory(path.join(distDir, "events/index.html"));
  await writeFile(path.join(distDir, "events/index.html"), eventsRender.html, "utf8");

  for (const eventId of eventsRender.eventIds) {
    const filePath = path.join(distDir, "events", eventId, "index.html");
    await ensureDirectory(filePath);
    await writeFile(filePath, await renderEventDetail(template, eventId), "utf8");
  }

  await ensureDirectory(path.join(distDir, "map/index.html"));
  await writeFile(path.join(distDir, "map/index.html"), await renderMap(template), "utf8");
};

void main();
