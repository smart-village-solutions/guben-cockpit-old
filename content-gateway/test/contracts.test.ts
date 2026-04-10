import { describe, expect, it } from "vitest";

import * as gatewayContracts from "../src/contracts.js";
import {
  eventSchema,
  gatewayErrorSchema,
  seoMetadataSchema,
} from "../../shared/public-content/contracts.js";

describe("gateway contracts re-export", () => {
  it("re-exports the shared public content schemas", () => {
    expect(gatewayContracts.seoMetadataSchema).toBe(seoMetadataSchema);
    expect(gatewayContracts.eventSchema).toBe(eventSchema);
    expect(gatewayContracts.gatewayErrorSchema).toBe(gatewayErrorSchema);
  });
});
