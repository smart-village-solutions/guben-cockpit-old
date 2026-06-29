import {
  eventDetailContentSchema,
  eventsContentSchema,
  footerContentSchema,
  homeContentSchema,
  mapContentSchema,
  projectsContentSchema,
} from "../../shared/public-content/contracts";

const baseUrl =
  process.env.PRERENDER_CONTENT_GATEWAY_URL?.trim() ||
  process.env.VITE_CONTENT_GATEWAY_URL?.trim() ||
  "http://localhost:5100";

const fetchJson = async (path: string) => {
  const response = await fetch(`${baseUrl}${path}`);
  if (!response.ok) {
    throw new Error(`Gateway contract check failed for ${path} with status ${response.status}`);
  }

  return response.json();
};

const main = async () => {
  homeContentSchema.parse(await fetchJson("/api/content/home"));
  projectsContentSchema.parse(await fetchJson("/api/content/projects?pageNumber=1&pageSize=12"));
  const events = eventsContentSchema.parse(
    await fetchJson("/api/content/events?pageNumber=1&pageSize=25"),
  );
  mapContentSchema.parse(await fetchJson("/api/content/map"));
  footerContentSchema.parse(await fetchJson("/api/content/footer"));

  const firstEventId = events.events.results[0]?.id;
  if (firstEventId) {
    eventDetailContentSchema.parse(await fetchJson(`/api/content/events/${firstEventId}`));
  }
};

void main();
