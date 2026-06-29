import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useRouteMetadata } from "./useRouteMetadata";

function MetadataHarness({
  metadata,
}: {
  metadata?: {
    title: string;
    description: string;
    canonical: string;
    indexable: boolean;
  };
}) {
  useRouteMetadata(metadata);
  return null;
}

describe("useRouteMetadata", () => {
  it("updates title, canonical link and social metadata", () => {
    render(
      <MetadataHarness
        metadata={{
          title: "Projektseite",
          description: "Beschreibung der Projektseite",
          canonical: "https://example.com/projects/1",
          indexable: false,
        }}
      />,
    );

    expect(document.title).toBe("Projektseite");
    expect(document.head.querySelector('meta[name="description"]')?.getAttribute("content")).toBe(
      "Beschreibung der Projektseite",
    );
    expect(document.head.querySelector('meta[name="robots"]')?.getAttribute("content")).toBe(
      "noindex,nofollow",
    );
    expect(document.head.querySelector('meta[property="og:title"]')?.getAttribute("content")).toBe(
      "Projektseite",
    );
    expect(
      document.head.querySelector('link[rel="canonical"]')?.getAttribute("href"),
    ).toBe("https://example.com/projects/1");
  });

  it("does nothing when no metadata is provided", () => {
    document.title = "Vorher";
    render(<MetadataHarness />);
    expect(document.title).toBe("Vorher");
  });
});
