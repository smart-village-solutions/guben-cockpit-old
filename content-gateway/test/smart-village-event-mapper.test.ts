import { describe, expect, it } from "vitest";

import { SmartVillageEventMapper } from "../src/content/smart-village-event-mapper.js";
import type { SmartVillageEventRecord } from "../src/upstream/smart-village-types.js";

const mapper = new SmartVillageEventMapper();

const makeRecord = (
  overrides: Partial<SmartVillageEventRecord> = {},
): SmartVillageEventRecord => ({
  id: "1937530",
  externalId: "99193148",
  title: "Sommerfest",
  description: "Beschreibung",
  visible: true,
  categories: [{ id: "910", name: "Fest / Brauchtum" }],
  addresses: [
    {
      street: "Ring 55",
      zip: "03172",
      city: "Guben",
      geoLocation: {
        latitude: 51.95,
        longitude: 14.67,
      },
    },
  ],
  location: {
    id: "loc-1",
    name: "Heilsarmee",
    geoLocation: {
      latitude: 51.9,
      longitude: 14.6,
    },
  },
  date: null,
  dates: [
    {
      dateStart: "2026-06-13",
      dateEnd: "2026-06-13",
      timeStart: "15:00",
      timeEnd: "19:00",
      timeDescription: "",
      weekday: null,
      useOnlyTimeDescription: "false",
    },
  ],
  urls: [{ description: "Mehr", url: "https://example.com" }],
  mediaContents: [{ sourceUrl: { url: "https://example.com/image.jpg", description: null } }],
  ...overrides,
});

describe("SmartVillageEventMapper", () => {
  it("maps one dates occurrence into one frontend event", () => {
    const events = mapper.eventsFromRecord(makeRecord());

    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({
      id: "1937530:2026-06-13:15%3A00",
      eventId: "99193148",
      terminId: "1937530:2026-06-13:15%3A00",
      title: "Sommerfest",
      description: "Beschreibung",
      startDate: "2026-06-13T15:00:00",
      endDate: "2026-06-13T19:00:00",
      location: {
        id: "loc-1",
        name: "Heilsarmee",
        city: "Guben",
        street: "Ring 55",
        telephoneNumber: null,
        fax: null,
        email: null,
        website: null,
        zip: "03172",
      },
      coordinates: {
        latitude: 51.95,
        longitude: 14.67,
      },
      urls: [{ link: "https://example.com", description: "Mehr" }],
      categories: [{ id: "910", name: "Fest / Brauchtum" }],
      images: [
        {
          thumbnailUrl: "https://example.com/image.jpg",
          previewUrl: "https://example.com/image.jpg",
          originalUrl: "https://example.com/image.jpg",
        },
      ],
      published: true,
    });
  });

  it("maps multiple dates entries into multiple frontend events with deterministic ids", () => {
    const record = makeRecord({
      dates: [
        {
          dateStart: "2026-06-13",
          dateEnd: "2026-06-13",
          timeStart: "15:00",
          timeEnd: "19:00",
        },
        {
          dateStart: "2026-06-14",
          dateEnd: "2026-06-14",
          timeStart: "10:00",
          timeEnd: "12:00",
        },
      ],
    });

    const firstPass = mapper.eventsFromRecord(record);
    const secondPass = mapper.eventsFromRecord(record);

    expect(firstPass).toHaveLength(2);
    expect(firstPass.map((event) => event.id)).toEqual([
      "1937530:2026-06-13:15%3A00",
      "1937530:2026-06-14:10%3A00",
    ]);
    expect(secondPass.map((event) => event.id)).toEqual(firstPass.map((event) => event.id));
  });

  it("keeps eventId on externalId while synthetic ids use the internal id", () => {
    const events = mapper.eventsFromRecord(makeRecord());

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      eventId: "99193148",
      id: "1937530:2026-06-13:15%3A00",
      terminId: "1937530:2026-06-13:15%3A00",
    });
  });

  it("maps known participation metadata and preserves an explicit false", () => {
    const [event] = mapper.eventsFromRecord(
      makeRecord({
        registrationRequired: false,
        maximumAttendees: 120,
      }),
    );

    expect(event).toMatchObject({
      registrationRequired: false,
      maximumAttendees: 120,
    });
  });

  it("omits unknown registration metadata and invalid attendee limits", () => {
    const [event] = mapper.eventsFromRecord(
      makeRecord({
        registrationRequired: null,
        maximumAttendees: 0,
      }),
    );

    expect(event).not.toHaveProperty("registrationRequired");
    expect(event).not.toHaveProperty("maximumAttendees");
  });

  it("skips records when the internal id is missing even if externalId is present", () => {
    const events = mapper.eventsFromRecord(
      makeRecord({
        id: null,
        externalId: "99193148",
      }),
    );

    expect(events).toEqual([]);
  });

  it("falls back to date when dates is empty", () => {
    const events = mapper.eventsFromRecord(
      makeRecord({
        externalId: null,
        visible: false,
        dates: [],
        date: {
          dateStart: "2026-07-01",
          dateEnd: null,
          timeStart: null,
          timeEnd: null,
        },
      }),
    );

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      id: "1937530:2026-07-01:all-day",
      eventId: "1937530",
      terminId: "1937530:2026-07-01:all-day",
      startDate: "2026-07-01T00:00:00",
      endDate: "2026-07-01T00:00:00",
      published: false,
    });
  });

  it("normalizes synthetic ids for HH:mm and HH:mm:ss inputs", () => {
    const first = mapper.eventsFromRecord(
      makeRecord({
        dates: [
          {
            dateStart: "2026-06-13",
            dateEnd: "2026-06-13",
            timeStart: "15:00",
            timeEnd: "19:00",
          },
        ],
      }),
    );
    const second = mapper.eventsFromRecord(
      makeRecord({
        dates: [
          {
            dateStart: "2026-06-13",
            dateEnd: "2026-06-13",
            timeStart: "15:00:00",
            timeEnd: "19:00:00",
          },
        ],
      }),
    );

    expect(first[0]?.id).toBe("1937530:2026-06-13:15%3A00");
    expect(second[0]?.id).toBe(first[0]?.id);
    expect(second[0]?.terminId).toBe(first[0]?.terminId);
  });

  it("keeps description-only occurrences on all-day local midnight fallback", () => {
    const events = mapper.eventsFromRecord(
      makeRecord({
        dates: [
          {
            dateStart: "2026-08-02",
            dateEnd: "2026-08-02",
            timeStart: null,
            timeEnd: null,
            timeDescription: "abends",
            useOnlyTimeDescription: true,
          },
        ],
      }),
    );

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      id: "1937530:2026-08-02:all-day",
      startDate: "2026-08-02T00:00:00",
      endDate: "2026-08-02T00:00:00",
    });
  });

  it("uses dateEnd with the start time when end time is missing", () => {
    const events = mapper.eventsFromRecord(
      makeRecord({
        dates: [
          {
            dateStart: "2026-08-10",
            dateEnd: "2026-08-11",
            timeStart: "18:30",
            timeEnd: null,
          },
        ],
      }),
    );

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      startDate: "2026-08-10T18:30:00",
      endDate: "2026-08-11T18:30:00",
    });
  });

  it("falls back to location coordinates when the address has none", () => {
    const events = mapper.eventsFromRecord(
      makeRecord({
        addresses: [{ street: "Ring 55", zip: "03172", city: "Guben", geoLocation: null }],
      }),
    );

    expect(events[0]?.coordinates).toEqual({
      latitude: 51.9,
      longitude: 14.6,
    });
  });

  it("skips records or occurrences missing required title or dateStart", () => {
    expect(
      mapper.eventsFromRecord(
        makeRecord({
          title: null,
        }),
      ),
    ).toEqual([]);

    expect(
      mapper.eventsFromRecord(
        makeRecord({
          dates: [
            {
              dateStart: null,
              dateEnd: "2026-06-13",
              timeStart: "15:00",
              timeEnd: "19:00",
            },
            {
              dateStart: "2026-06-14",
              dateEnd: "2026-06-14",
              timeStart: "10:00",
              timeEnd: "12:00",
            },
          ],
        }),
      ).map((event) => event.id),
    ).toEqual(["1937530:2026-06-14:10%3A00"]);
  });
});

describe("Biletado image projection", () => {
  it.each([null, [], [{ sourceUrl: { url: "https://example.test/one.jpg", description: " Eingangsbereich " } }]])(
    "handles absent and single images: %j", (mediaContents) => {
      const [event] = mapper.eventsFromRecord(makeRecord({ mediaContents }));
      expect(event.images).toHaveLength(mediaContents?.length ?? 0);
      if (event.images.length) expect(event.images[0].description).toBe("Eingangsbereich");
    },
  );

  it("preserves image order and descriptions while rejecting invalid image and ticket URLs", () => {
    const [event] = mapper.eventsFromRecord(makeRecord({
      mediaContents: [
        { sourceUrl: { url: "https://example.test/second.jpg", description: " Zweites Motiv " } },
        { sourceUrl: { url: "javascript:alert(1)", description: "Unsafe" } },
        { sourceUrl: { url: "data:image/png;base64,abc" } },
        { sourceUrl: { url: "/relative.jpg" } },
        { sourceUrl: { url: " " } },
        { sourceUrl: null },
        { sourceUrl: { url: "http://example.test/first.jpg", description: " " } },
      ],
      urls: [{ url: "javascript:alert(1)" }, { url: " https://tickets.example.test ", description: " Tickets " }],
    }));
    expect(event.images).toEqual([
      { thumbnailUrl: "https://example.test/second.jpg", previewUrl: "https://example.test/second.jpg", originalUrl: "https://example.test/second.jpg", description: "Zweites Motiv" },
      { thumbnailUrl: "http://example.test/first.jpg", previewUrl: "http://example.test/first.jpg", originalUrl: "http://example.test/first.jpg" },
    ]);
    expect(event.urls).toEqual([{ link: "https://tickets.example.test", description: "Tickets" }]);
  });

  it("does not invent a location from the event title", () => {
    const [event] = mapper.eventsFromRecord(makeRecord({ addresses: [], location: null }));
    expect(event.location.name).toBe("");
    expect(event.location.street).toBeNull();
  });
});
