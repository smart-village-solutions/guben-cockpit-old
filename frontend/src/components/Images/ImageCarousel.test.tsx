import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ImageCarousel } from "./ImageCarousel";

describe("ImageCarousel", () => {
  it("renders contain-mode images on a gray background and advances through slides", () => {
    const { container } = render(
      <ImageCarousel
        images={[
          {
            filename: "https://example.com/Images/gallery/Erstes-Bild.jpg",
          },
          {
            filename: "zweites-bild.jpg",
            directory: "/assets",
          },
        ]}
      />,
    );

    const image = container.querySelector("img");
    expect(image).toBeTruthy();
    expect(image.className).toContain("object-contain");
    expect(image.className).toContain("bg-[#808080]");
    expect(screen.getByText("1 / 2")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Next Image" }));

    expect(screen.getByText("2 / 2")).toBeTruthy();
    expect((container.querySelector("img") as HTMLImageElement).src).toContain("/assets/zweites-bild.jpg");
  });
});
