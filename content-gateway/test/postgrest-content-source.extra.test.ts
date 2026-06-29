import { describe, expect, it, vi } from "vitest";

import { PostgrestContentSource } from "../src/content/postgrest-content-source.js";

describe("PostgrestContentSource", () => {
  it("loads the event bundle from the expected resources", async () => {
    const select = vi.fn(async (resource: string) => [{ resource }]);
    const source = new PostgrestContentSource({ select } as never);

    const bundle = await source.getEventsBundle();

    expect(bundle).toEqual({
      eventRows: [{ resource: "events" }],
      locationRows: [{ resource: "locations" }],
      categoryRows: [{ resource: "event_categories" }],
      urlRows: [{ resource: "event_urls" }],
      imageRows: [{ resource: "event_images" }],
      bookingTenantRows: [{ resource: "booking_tenants" }],
    });
    expect(select).toHaveBeenCalledTimes(6);
    expect(select).toHaveBeenCalledWith(
      "event_images",
      expect.objectContaining({
        select: "event_id,original_url,preview_url,thumbnail_url",
      }),
    );
  });

  it("returns null when an event detail cannot be found", async () => {
    const select = vi.fn(async (resource: string) => (resource === "events" ? [] : [{ resource }]));
    const source = new PostgrestContentSource({ select } as never);

    await expect(source.getEventDetailBundle("missing")).resolves.toBeNull();
    expect(select).toHaveBeenCalledTimes(1);
  });

  it("loads dashboard, footer and booking tenant rows with stable queries", async () => {
    const select = vi.fn(async (resource: string) => [{ resource }]);
    const source = new PostgrestContentSource({ select } as never);

    await expect(source.getDashboardRows()).resolves.toEqual({
      dropdownRows: [{ resource: "dashboard_dropdowns" }],
      tabRows: [{ resource: "dashboard_tabs" }],
      cardRows: [{ resource: "information_cards" }],
      linkRows: [{ resource: "dropdown_links" }],
    });
    await expect(source.getFooterRows()).resolves.toEqual([{ resource: "footer_items" }]);
    await expect(source.getBookingTenantRows()).resolves.toEqual([{ resource: "booking_tenants" }]);
  });
});
