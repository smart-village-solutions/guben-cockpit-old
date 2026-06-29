import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DetailPageLayout } from "./DetailPageLayout";

describe("DetailPageLayout", () => {
  it("shows the full hero image inside the fixed area with gray letterboxing", () => {
    const { container } = render(
      <DetailPageLayout
        heroImage="/hero.jpg"
        heroAlt="Kopfbild"
        title="Detailtitel"
        metadata={<p>Metadaten</p>}
      >
        <p>Inhalt</p>
      </DetailPageLayout>,
    );

    const image = screen.getByRole("img", { name: "Kopfbild" });

    expect(image.className).toContain("object-contain");
    expect(image.className).not.toContain("object-cover");
    expect(container.querySelector(".bg-\\[\\#808080\\]")).toBeTruthy();
  });
});
