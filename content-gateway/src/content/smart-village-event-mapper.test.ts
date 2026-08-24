import { describe, expect, it } from "vitest";

import { SmartVillageEventMapper } from "./smart-village-event-mapper.js";

describe("SmartVillageEventMapper", () => {
  it("maps valid optional event metadata and drops empty values", () => {
    const [event] = new SmartVillageEventMapper().eventsFromRecord({
      id: "event-1",
      externalId: "external-1",
      title: "Sommerfest",
      visible: true,
      date: { dateStart: "2026-06-01", dateEnd: null, timeStart: "10:00", timeEnd: null },
      contacts: [{ email: "kontakt@example.test", phone: "", webUrls: [{ url: "https://example.test" }] }],
      organizer: { name: "Guben Kultur" },
      priceInformations: [
        { name: "Erwachsene", description: "Abendkasse", amount: 3 },
        { name: "", description: "", amount: null },
      ],
      dataProvider: { name: "Cockpit User" },
      registrationRequired: false,
      maximumAttendees: 120,
    });

    expect(event).toMatchObject({
      organizerName: "Guben Kultur",
      contact: {
        email: "kontakt@example.test",
        phone: null,
        website: "https://example.test",
      },
      priceInformations: [{ name: "Erwachsene", description: "Abendkasse", amount: 3 }],
      dataProviderName: "Cockpit User",
      registrationRequired: false,
      maximumAttendees: 120,
    });
  });

  it("omits invalid or unknown participation metadata", () => {
    const [event] = new SmartVillageEventMapper().eventsFromRecord({
      id: "event-1",
      title: "Sommerfest",
      visible: true,
      date: { dateStart: "2026-06-01", dateEnd: null, timeStart: "10:00", timeEnd: null },
      registrationRequired: null,
      maximumAttendees: 0,
    });

    expect(event).not.toHaveProperty("registrationRequired");
    expect(event).not.toHaveProperty("maximumAttendees");
  });
});
