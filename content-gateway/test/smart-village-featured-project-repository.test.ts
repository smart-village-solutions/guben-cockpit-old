import { describe, expect, it, vi } from "vitest";

import { SmartVillageFeaturedProjectRepository } from "../src/content/smart-village-featured-project-repository.js";
import {
  duplicateSmartVillageFeaturedProjects,
  representativeSmartVillageFeaturedProjects,
} from "./fixtures/smart-village-featured-projects.js";

const createRepository = (genericItems: unknown, warn = vi.fn()) => {
  const request = vi.fn(async () => ({ genericItems }));
  return {
    repository: new SmartVillageFeaturedProjectRepository({
      client: { request: request as never },
      publicBaseUrl: "https://cockpit.example.com",
      warn,
    }),
    request,
    warn,
  };
};

describe("SmartVillageFeaturedProjectRepository", () => {
  it("queries ordered FeaturedProject GenericItems and maps only public records", async () => {
    const { repository, request, warn } = createRepository(representativeSmartVillageFeaturedProjects);
    await expect(repository.getFeaturedProjects("de")).resolves.toEqual([
      {
        id: "513", type: 1, title: "Energiebericht der Stadt Guben", description: "", fullText: "<p>Projektdetails</p>",
        imageCaption: "Bildunterschrift", imageUrl: "https://example.com/project.jpg", imageCredits: "Stadt Guben", published: true,
      },
      {
        id: "1071", type: 1, title: "Bildungscampus Altstadt Ost", description: "", fullText: "",
        imageCaption: null, imageUrl: null, imageCredits: null, published: true,
      },
    ]);
    expect(request).toHaveBeenCalledWith(expect.stringContaining('genericItems(genericType: "FeaturedProject", order: id_ASC)'));
    expect(warn).toHaveBeenCalledTimes(3);
  });

  it("returns identical Mainserver content for every requested locale", async () => {
    const { repository } = createRepository([representativeSmartVillageFeaturedProjects[0]]);
    await expect(repository.getFeaturedProjects("pl")).resolves.toEqual(await repository.getFeaturedProjects("en"));
  });

  it("skips invalid media URLs and preserves optional projects", async () => {
    const item = { ...representativeSmartVillageFeaturedProjects[0], mediaContents: [{ sourceUrl: { url: "javascript:alert(1)" } }] };
    const { repository } = createRepository([item]);
    await expect(repository.getFeaturedProjects("de")).resolves.toMatchObject([{ imageUrl: null }]);
  });

  it("rejects malformed collection envelopes and duplicate identities", async () => {
    await expect(createRepository(null).repository.getFeaturedProjects("de")).rejects.toMatchObject({ code: "INVALID_UPSTREAM_PAYLOAD" });
    await expect(createRepository(duplicateSmartVillageFeaturedProjects).repository.getFeaturedProjects("de")).rejects.toMatchObject({
      code: "INVALID_UPSTREAM_PAYLOAD",
      message: expect.stringContaining("duplicate"),
    });
  });

  it("loads detail by externalId and preserves the public URL", async () => {
    const { repository, request } = createRepository([representativeSmartVillageFeaturedProjects[0]]);
    await expect(repository.getFeaturedProjectById("de", "513")).resolves.toMatchObject({
      project: { id: "513", title: "Energiebericht der Stadt Guben" },
      seo: { canonical: "https://cockpit.example.com/projects/513", indexable: true },
    });
    expect(request).toHaveBeenCalledWith(expect.stringContaining("externalId: $externalId"), { externalId: "513" });
  });

  it("returns not found for absent public detail and rejects duplicate detail", async () => {
    await expect(createRepository([]).repository.getFeaturedProjectById("de", "missing")).rejects.toMatchObject({ code: "NOT_FOUND", statusCode: 404 });
    await expect(createRepository(duplicateSmartVillageFeaturedProjects).repository.getFeaturedProjectById("de", "duplicate")).rejects.toMatchObject({ code: "INVALID_UPSTREAM_PAYLOAD" });
  });

  it("propagates GraphQL failures without fallback", async () => {
    const request = vi.fn(async () => { throw new Error("offline"); });
    const repository = new SmartVillageFeaturedProjectRepository({ client: { request: request as never }, publicBaseUrl: "https://cockpit.example.com" });
    await expect(repository.getFeaturedProjects("de")).rejects.toThrow("offline");
  });

  it("accepts an upstream detail deletion and returns not found", async () => {
    const responses = [{ genericItems: [representativeSmartVillageFeaturedProjects[0]] }, { genericItems: [] }];
    const requestCached = vi.fn(async (options: { validate: (value: unknown) => void }) => {
      const value = responses.shift();
      options.validate(value);
      return value;
    });
    const repository = new SmartVillageFeaturedProjectRepository({
      client: { request: vi.fn(), requestCached } as never,
      publicBaseUrl: "https://cockpit.example.com",
    });

    await expect(repository.getFeaturedProjectById("de", "513")).resolves.toMatchObject({ project: { id: "513" } });
    await expect(repository.getFeaturedProjectById("de", "513")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
