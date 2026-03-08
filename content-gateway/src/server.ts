import { loadConfig } from "./config.js";
import { createApp } from "./app.js";
import {
  MockContentRepository,
  PostgrestContentRepository,
} from "./content/content-repository.js";
import { PostgrestClient } from "./upstream/postgrest-client.js";

const config = loadConfig();
const postgrestClient = config.CONTENT_SOURCE_MODE === "postgrest" ? new PostgrestClient(config) : null;
const repository =
  config.CONTENT_SOURCE_MODE === "mock"
    ? new MockContentRepository()
    : new PostgrestContentRepository(config, postgrestClient!);

const app = createApp({
  config,
  repository,
  readinessProbe:
    config.CONTENT_SOURCE_MODE === "mock"
      ? async () => ({
          ready: true,
          checks: {},
        })
      : async () => {
          const ready = await postgrestClient!.checkReadiness();
          return {
            ready,
            checks: {
              postgrest: {
                ready,
              },
            },
          };
        },
});

try {
  await app.listen({
    host: "0.0.0.0",
    port: config.PORT,
  });
} catch (error) {
  app.log.error(error, "Failed to start content gateway");
  process.exitCode = 1;
}
