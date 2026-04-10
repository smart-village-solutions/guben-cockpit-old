import { describe, expect, it, vi } from "vitest";

import type { ProjectsContent } from "@shared/public-content/contracts";
import { loadGatewayProjectDetailContent } from "./hooks";

type ProjectFetcher = Parameters<typeof loadGatewayProjectDetailContent>[2];

const createProjectsContent = (
  businesses: ProjectsContent["businesses"]["results"],
  pageCount: number,
): ProjectsContent => ({
  page: {
    id: "Projects",
    title: "Projects",
    description: "Projects page",
    seo: {
      title: "Projects",
      description: "Projects page",
      canonical: "https://example.com/projects",
      indexable: true,
    },
  },
  featuredProjects: [
    {
      id: "featured-1",
      type: 1,
      title: "Featured",
      description: "Featured project",
      fullText: "Featured full text",
      imageCaption: null,
      imageUrl: null,
      imageCredits: null,
      published: true,
    },
  ],
  schools: [
    {
      id: "school-1",
      type: 2,
      title: "School",
      description: "School project",
      fullText: "School full text",
      imageCaption: null,
      imageUrl: null,
      imageCredits: null,
      published: true,
    },
  ],
  businesses: {
    pageNumber: 1,
    pageSize: 100,
    totalCount: businesses.length,
    pageCount,
    results: businesses,
  },
  seo: {
    title: "Projects",
    description: "Projects page",
    canonical: "https://example.com/projects",
    indexable: true,
  },
  });

describe("loadGatewayProjectDetailContent", () => {
  it("fetches additional business pages until the project is found", async () => {
    const fetcher = vi.fn() as unknown as ProjectFetcher & ReturnType<typeof vi.fn>;
    vi.mocked(fetcher)
      .mockResolvedValueOnce(
        createProjectsContent(
          [
            {
              id: "business-1",
              type: 0,
              title: "Business 1",
              description: "Business 1",
              fullText: "Business 1",
              imageCaption: null,
              imageUrl: null,
              imageCredits: null,
              published: true,
            },
          ],
          2,
        ),
      )
      .mockResolvedValueOnce(
        createProjectsContent(
          [
            {
              id: "business-2",
              type: 0,
              title: "Business 2",
              description: "Business 2",
              fullText: "Business 2",
              imageCaption: null,
              imageUrl: null,
              imageCredits: null,
              published: true,
            },
          ],
          2,
        ),
      );

    const result = await loadGatewayProjectDetailContent("de", "business-2", fetcher);

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher).toHaveBeenNthCalledWith(
      2,
      "/api/content/projects",
      expect.anything(),
      { lang: "de", pageNumber: 2, pageSize: 100 },
    );
    expect(result._category).toBe("marketplace");
    expect(result.results[0]).toMatchObject({
      id: "business-2",
      _category: "marketplace",
    });
    expect(result.seo.canonical).toBe("https://example.com/projects");
  });

  it("throws a clear error when the requested project does not exist", async () => {
    const fetcher = vi.fn() as unknown as ProjectFetcher & ReturnType<typeof vi.fn>;
    vi.mocked(fetcher).mockResolvedValue(
      createProjectsContent([], 1),
    );

    await expect(
      loadGatewayProjectDetailContent("de", "missing", fetcher),
    ).rejects.toThrow("Project with ID missing not found");
  });
});
