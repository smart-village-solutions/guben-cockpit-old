export class MetricsRegistry {
  private readonly requestLatencyBuckets = [50, 100, 250, 500, 750, 1000, 2500, 5000];
  private readonly requestLatencies = new Map<
    string,
    {
      count: number;
      sum: number;
      buckets: number[];
    }
  >();
  private readonly upstreamFailures = new Map<string, number>();

  public recordRequest(route: string, statusCode: number, durationMs: number): void {
    const key = `${route}|${statusCode}`;
    const metric =
      this.requestLatencies.get(key) ??
      {
        count: 0,
        sum: 0,
        buckets: this.requestLatencyBuckets.map(() => 0),
      };

    metric.count += 1;
    metric.sum += durationMs;

    this.requestLatencyBuckets.forEach((bucket, index) => {
      if (durationMs <= bucket) {
        metric.buckets[index] += 1;
      }
    });

    this.requestLatencies.set(key, metric);
  }

  public recordUpstreamFailure(upstream: string, code: string): void {
    const key = `${upstream}|${code}`;
    this.upstreamFailures.set(key, (this.upstreamFailures.get(key) ?? 0) + 1);
  }

  public renderPrometheus(): string {
    const lines = [
      "# HELP gateway_request_duration_ms HTTP request durations in milliseconds.",
      "# TYPE gateway_request_duration_ms histogram",
    ];

    for (const [key, metric] of this.requestLatencies.entries()) {
      const [route, statusCode] = key.split("|");
      this.requestLatencyBuckets.forEach((bucket, index) => {
        lines.push(
          `gateway_request_duration_ms_bucket{route="${route}",status_code="${statusCode}",le="${bucket}"} ${metric.buckets[index]}`,
        );
      });
      lines.push(
        `gateway_request_duration_ms_bucket{route="${route}",status_code="${statusCode}",le="+Inf"} ${metric.count}`,
      );
      lines.push(
        `gateway_request_duration_ms_sum{route="${route}",status_code="${statusCode}"} ${metric.sum}`,
      );
      lines.push(
        `gateway_request_duration_ms_count{route="${route}",status_code="${statusCode}"} ${metric.count}`,
      );
    }

    lines.push(
      "# HELP gateway_upstream_failures_total Count of upstream failures by upstream and error code.",
    );
    lines.push("# TYPE gateway_upstream_failures_total counter");
    for (const [key, count] of this.upstreamFailures.entries()) {
      const [upstream, code] = key.split("|");
      lines.push(
        `gateway_upstream_failures_total{upstream="${upstream}",code="${code}"} ${count}`,
      );
    }

    return `${lines.join("\n")}\n`;
  }
}
