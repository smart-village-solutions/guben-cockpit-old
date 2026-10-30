import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BaseImgTag } from "./BaseImgTag";

describe("BaseImgTag", () => {
  it("loads the fallback from the public asset URL", () => {
    render(<BaseImgTag src="/missing.jpg" alt="Projekt" />);
    const image = screen.getByRole("img") as HTMLImageElement;
    fireEvent.error(image);
    expect(image.getAttribute("src")).toBe("/images/image-not-found.png");
  });

  it("stops retrying when the fallback also fails", () => {
    render(<BaseImgTag src="/missing.jpg" alt="Projekt" />);
    const image = screen.getByRole("img") as HTMLImageElement;
    fireEvent.error(image);
    const setAttribute = vi.spyOn(image, "setAttribute");
    const srcSetter = vi.spyOn(image, "src", "set");
    fireEvent.error(image);
    expect(setAttribute).not.toHaveBeenCalled();
    expect(srcSetter).not.toHaveBeenCalled();
  });
});
