export type PublicContentSource = "gateway" | "disabled";

const configuredSource = import.meta.env.VITE_PUBLIC_CONTENT_SOURCE?.trim();
const configuredGatewayUrl = import.meta.env.VITE_CONTENT_GATEWAY_URL?.trim();

export const publicContentSource: PublicContentSource =
  configuredSource === "disabled" ? "disabled" : "gateway";

export const isGatewayPublicContentEnabled = publicContentSource === "gateway";

const browserOrigin =
  typeof globalThis.location?.origin === "string" ? globalThis.location.origin : undefined;

export const contentGatewayBaseUrl =
  (configuredGatewayUrl ||
  browserOrigin) ??
  "http://localhost:5100";
