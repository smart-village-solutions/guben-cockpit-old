export type PublicContentSource = "gateway" | "disabled";

const configuredSource = import.meta.env.VITE_PUBLIC_CONTENT_SOURCE;

export const publicContentSource: PublicContentSource =
  configuredSource === "disabled" ? "disabled" : "gateway";

export const isGatewayPublicContentEnabled = publicContentSource === "gateway";

const browserOrigin =
  typeof globalThis.location?.origin === "string" ? globalThis.location.origin : undefined;

export const contentGatewayBaseUrl =
  import.meta.env.VITE_CONTENT_GATEWAY_URL ??
  browserOrigin ??
  "http://localhost:5100";
