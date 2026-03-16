import { describe, expect, it } from "vitest";

import { MetricsRegistry } from "../src/metrics.js";

describe("MetricsRegistry", () => {
  it("renders histogram buckets instead of unbounded samples", () => {
    const metrics = new MetricsRegistry();

    metrics.recordRequest("/api/content/home", 200, 120);
    metrics.recordRequest("/api/content/home", 200, 820);
    metrics.recordUpstreamFailure("postgrest", "UPSTREAM_TIMEOUT");

    const output = metrics.renderPrometheus();

    expect(output).toContain('# TYPE gateway_request_duration_ms histogram');
    expect(output).toContain('gateway_request_duration_ms_bucket{route="/api/content/home",status_code="200",le="250"} 1');
    expect(output).toContain('gateway_request_duration_ms_bucket{route="/api/content/home",status_code="200",le="1000"} 2');
    expect(output).toContain('gateway_request_duration_ms_bucket{route="/api/content/home",status_code="200",le="+Inf"} 2');
    expect(output).toContain('gateway_upstream_failures_total{upstream="postgrest",code="UPSTREAM_TIMEOUT"} 1');
  });
});
