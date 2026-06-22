import Fastify from "fastify";
import cors from "@fastify/cors";
import { z } from "zod";

import { Config } from "./config.js";
import type { PublicContentRepository } from "./content/content-repository-contract.js";
import { GatewayError, isGatewayError } from "./errors.js";
import { MetricsRegistry } from "./metrics.js";

const pageQuerySchema = z.object({
  lang: z.string().optional(),
});

const pagingSchema = z.object({
  lang: z.string().optional(),
  pageNumber: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(12),
});

const eventsQuerySchema = z.object({
  lang: z.string().optional(),
  pageNumber: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(25),
  title: z.string().optional(),
  category: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.string().optional(),
  ordering: z.string().optional(),
  distance: z.coerce.number().optional(),
});

export function createApp(options: {
  config: Config;
  repository: PublicContentRepository;
  metrics?: MetricsRegistry;
  readinessProbe?: () => Promise<{
    ready: boolean;
    checks: Record<string, { ready: boolean }>;
  }>;
}) {
  const metrics = options.metrics ?? new MetricsRegistry();
  const readinessProbe =
    options.readinessProbe ??
    (async () => ({
      ready: true,
      checks: {},
    }));
  const app = Fastify({
    logger: {
      level: options.config.LOG_LEVEL,
    },
  });

  void app.register(cors, {
    origin: true,
    methods: ["GET", "OPTIONS"],
  });

  app.addHook("onRequest", async (request) => {
    request.headers["x-request-start"] = String(Date.now());
  });

  app.addHook("onResponse", async (request, reply) => {
    const startedAt = Number(request.headers["x-request-start"] ?? Date.now());
    const route = request.routeOptions.url ?? request.url;
    metrics.recordRequest(route, reply.statusCode, Date.now() - startedAt);
    request.log.info(
      {
        route,
        statusCode: reply.statusCode,
        durationMs: Date.now() - startedAt,
      },
      "request completed",
    );
  });

  app.get("/health", async () => ({
    status: "ok",
    contentSourceMode: options.config.CONTENT_SOURCE_MODE,
  }));

  app.get("/health/live", async () => ({
    status: "ok",
  }));

  app.get("/health/ready", async (_request, reply) => {
    const readiness = await readinessProbe();
    reply.status(readiness.ready ? 200 : 503);
    return {
      status: readiness.ready ? "ok" : "not_ready",
      contentSourceMode: options.config.CONTENT_SOURCE_MODE,
      ready: readiness.ready,
      checks: readiness.checks,
    };
  });

  app.get("/metrics", async (_request, reply) => {
    reply.type("text/plain; version=0.0.4");
    return metrics.renderPrometheus();
  });

  app.get("/api/content/home", async (request) => {
    const query = pageQuerySchema.parse(request.query);
    return options.repository.getHome(resolveLanguage(query.lang, request.headers["accept-language"], options.config));
  });

  app.get("/api/content/dashboard", async (request) => {
    const query = pageQuerySchema.parse(request.query);
    return options.repository.getDashboard(
      resolveLanguage(query.lang, request.headers["accept-language"], options.config),
    );
  });

  app.get("/api/content/projects", async (request) => {
    const query = pagingSchema.parse(request.query);
    return options.repository.getProjects(
      resolveLanguage(query.lang, request.headers["accept-language"], options.config),
      query.pageNumber,
      query.pageSize,
    );
  });

  app.get("/api/content/public", async (request) => {
    const query = pageQuerySchema.parse(request.query);
    return options.repository.getPublicContent(
      resolveLanguage(query.lang, request.headers["accept-language"], options.config),
    );
  });

  app.get("/api/content/events", async (request) => {
    const query = eventsQuerySchema.parse(request.query);
    return options.repository.getEvents(
      resolveLanguage(query.lang, request.headers["accept-language"], options.config),
      query,
    );
  });

  app.get("/api/content/events/:id", async (request) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const query = pageQuerySchema.parse(request.query);
    return options.repository.getEventById(
      resolveLanguage(query.lang, request.headers["accept-language"], options.config),
      params.id,
    );
  });

  app.get("/api/content/map", async (request) => {
    const query = pageQuerySchema.parse(request.query);
    return options.repository.getMap(resolveLanguage(query.lang, request.headers["accept-language"], options.config));
  });

  app.get("/api/content/footer", async () => options.repository.getFooter());

  app.get("/api/content/booking-tenants", async () => options.repository.getBookingTenants());

  app.setErrorHandler((error, request, reply) => {
    const gatewayError = normalizeError(error);
    if (gatewayError.upstream !== "gateway") {
      metrics.recordUpstreamFailure(gatewayError.upstream, gatewayError.code);
    }

    request.log.error(
      {
        err: error,
        code: gatewayError.code,
        upstream: gatewayError.upstream,
      },
      "request failed",
    );

    reply.status(gatewayError.statusCode).send({
      error: {
        code: gatewayError.code,
        message: gatewayError.message,
        upstream: gatewayError.upstream,
        retryable: gatewayError.retryable,
        requestId: request.id,
      },
    });
  });

  return app;
}

const normalizeError = (error: unknown): GatewayError => {
  if (isGatewayError(error)) {
    return error;
  }

  return new GatewayError({
    code: "INTERNAL_ERROR",
    message: "Internal gateway error",
    statusCode: 500,
    upstream: "gateway",
    retryable: false,
  });
};

const resolveLanguage = (
  explicitLanguage: string | undefined,
  acceptLanguageHeader: string | string[] | undefined,
  config: Config,
) => {
  if (explicitLanguage) {
    return explicitLanguage.slice(0, 2).toLowerCase();
  }

  const header = Array.isArray(acceptLanguageHeader)
    ? acceptLanguageHeader[0]
    : acceptLanguageHeader;
  if (!header) {
    return config.DEFAULT_LANGUAGE;
  }

  return header.split(",")[0]?.trim().slice(0, 2).toLowerCase() || config.DEFAULT_LANGUAGE;
};
