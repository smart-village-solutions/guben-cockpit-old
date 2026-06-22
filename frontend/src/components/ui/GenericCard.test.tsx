import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GenericCard } from "./GenericCard";

describe("GenericCard", () => {
  it("renders fixed image areas without cropping and with a gray background", () => {
    const { container } = render(
      <GenericCard
        imageUrl="/project.jpg"
        imageAlt="Projektbild"
        title="Projekt 1"
      />,
    );

    const image = screen.getByRole("img", { name: "Projektbild" });

    expect(image.className).toContain("object-contain");
    expect(image.className).not.toContain("object-cover");
    expect(container.querySelector(".bg-\\[\\#808080\\]")).toBeTruthy();
  });
});
