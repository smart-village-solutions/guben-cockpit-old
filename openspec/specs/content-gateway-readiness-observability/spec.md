# content-gateway-readiness-observability Specification

## Purpose
TBD - created by archiving change content-gateway-architecture-hardening. Update Purpose after archive.
## Requirements
### Requirement: Gateway exposes liveness and readiness separately
The content gateway SHALL provide a liveness signal for process health and a readiness signal that reflects only the dependencies required by the active content source mode.

#### Scenario: Liveness remains healthy during upstream outage
- **WHEN** the gateway process is running but an active upstream dependency is unavailable
- **THEN** the liveness signal remains healthy while the readiness signal reports not ready

#### Scenario: Readiness follows active dependency mode
- **WHEN** the gateway runs in `mock` mode
- **THEN** the readiness signal does not require any external upstream to be available

### Requirement: Gateway exports bounded alertable metrics
The content gateway MUST expose Prometheus-compatible request latency and upstream failure metrics without storing unbounded per-request history in memory.

#### Scenario: Metrics expose aggregatable latency buckets
- **WHEN** Prometheus scrapes the gateway metrics endpoint
- **THEN** the response includes request latency metrics in an aggregatable form suitable for percentile-based alerting

#### Scenario: Metrics storage remains bounded over time
- **WHEN** the gateway handles requests over a long-running process lifetime
- **THEN** the in-process metric representation stays bounded and does not grow linearly with every served request

