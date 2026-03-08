export type PublicContentSource = "gateway" | "disabled";

const configuredSource = import.meta.env.VITE_PUBLIC_CONTENT_SOURCE;

export const publicContentSource: PublicContentSource =
  configuredSource === "disabled" ? "disabled" : "gateway";

export const isGatewayPublicContentEnabled = publicContentSource === "gateway";

export const contentGatewayBaseUrl =
  import.meta.env.VITE_CONTENT_GATEWAY_URL ?? "http://localhost:5100";
