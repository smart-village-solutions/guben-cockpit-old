import { loadConfig, type PostgrestConfig } from "./config.js";
import { createApp } from "./app.js";
import {
  MockContentRepository,
  PostgrestContentRepository,
} from "./content/content-repository.js";
import { SmartVillagePostgrestContentRepository } from "./content/smart-village-postgrest-content-repository.js";
import { SmartVillageEventRepository } from "./content/smart-village-event-repository.js";
import { SmartVillageBookingFaqRepository } from "./content/smart-village-booking-faq-repository.js";
import { SmartVillageCockpitCardRepository } from "./content/smart-village-cockpit-card-repository.js";
import { SmartVillagePoiRepository } from "./content/smart-village-poi-repository.js";
import { PostgrestClient } from "./upstream/postgrest-client.js";
import { SmartVillageGraphQLClient } from "./upstream/smart-village-graphql-client.js";
import { SmartVillageOAuthClient } from "./upstream/smart-village-oauth-client.js";

const config = loadConfig();
const smartVillageReadinessQuery = `
  query ContentGatewayReadiness {
    eventRecords(limit: 1) {
      id
    }
  }
`;
const createSmartVillageWarnHook = () => (message: string, context: Record<string, unknown>) => {
  app?.log.warn(context, message);
};

const mockReadinessProbe = async () => ({
  ready: true,
  checks: {},
});

const createPostgrestMode = (postgrestConfig: PostgrestConfig) => {
  const postgrestClient = new PostgrestClient(postgrestConfig);
  const postgrestRepository = new PostgrestContentRepository(postgrestConfig, postgrestClient);
  const smartVillageOAuthClient = new SmartVillageOAuthClient({
    tokenUrl: postgrestConfig.SV_OAUTH_TOKEN_URL,
    clientId: postgrestConfig.SV_CLIENT_ID,
    clientSecret: postgrestConfig.SV_CLIENT_SECRET,
  });
  const smartVillageGraphQLClient = new SmartVillageGraphQLClient({
    graphqlUrl: postgrestConfig.SV_GRAPHQL_URL,
    oauthClient: smartVillageOAuthClient,
  });
  const smartVillageEventRepository = new SmartVillageEventRepository({
    client: smartVillageGraphQLClient,
    publicBaseUrl: postgrestConfig.PUBLIC_BASE_URL,
    warn: createSmartVillageWarnHook(),
  });
  const smartVillageBookingFaqRepository = new SmartVillageBookingFaqRepository({
    client: smartVillageGraphQLClient,
    warn: createSmartVillageWarnHook(),
  });
  const smartVillageCockpitCardRepository = new SmartVillageCockpitCardRepository({
    client: smartVillageGraphQLClient,
    warn: createSmartVillageWarnHook(),
  });
  const smartVillagePoiRepository = new SmartVillagePoiRepository({
    client: smartVillageGraphQLClient,
    publicBaseUrl: postgrestConfig.PUBLIC_BASE_URL,
    warn: createSmartVillageWarnHook(),
  });

  return {
    repository: new SmartVillagePostgrestContentRepository({
      postgrestRepository,
      smartVillageEventRepository,
      smartVillageBookingFaqRepository,
      smartVillageCockpitCardRepository,
      smartVillagePoiRepository,
      warn: createSmartVillageWarnHook(),
    }),
    readinessProbe: async () => {
      const postgrestReady = await postgrestClient.checkReadiness();
      const smartVillageReady = await smartVillageGraphQLClient
        .request<{ eventRecords: Array<{ id: string }> }>(smartVillageReadinessQuery)
        .then(() => true)
        .catch((error: unknown) => {
          app.log.warn({ err: error }, "Smart Village readiness check failed");
          return false;
        });

      return {
        ready: postgrestReady && smartVillageReady,
        checks: {
          postgrest: {
            ready: postgrestReady,
          },
          smartvillage: {
            ready: smartVillageReady,
          },
        },
      };
    },
  };
};

const { repository, readinessProbe } =
  config.CONTENT_SOURCE_MODE === "mock"
    ? {
        repository: new MockContentRepository(),
        readinessProbe: mockReadinessProbe,
      }
    : createPostgrestMode(config);

const app = createApp({
  config,
  repository,
  readinessProbe,
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
