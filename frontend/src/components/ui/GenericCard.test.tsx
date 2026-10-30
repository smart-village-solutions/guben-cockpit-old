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
  it("renders React node descriptions without object stringification even when HTML mode is requested", () => {
    const { rerender } = render(<GenericCard title="Project" description={<strong>Rich description</strong>} descriptionAsHtml />);
    expect(screen.getByText("Rich description").tagName).toBe("STRONG");
    expect(screen.queryByText("[object Object]")).toBeNull();
    rerender(<GenericCard title="Project" description="<em>HTML description</em>" descriptionAsHtml />);
    expect(screen.getByText("HTML description").tagName).toBe("EM");
    rerender(<GenericCard title="Project" description="<em>Literal description</em>" />);
    expect(screen.getByText("<em>Literal description</em>")).toBeTruthy();
  });

});
