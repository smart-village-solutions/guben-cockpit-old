import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EditableImage } from "./editableImage";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("EditableImage", () => {
  it("renders preview images contained inside a gray frame and can switch back to editing", () => {
    const onChange = vi.fn();

    render(
      <EditableImage
        imageUrl="/preview.jpg"
        imageAlt="Vorschaubild"
        onChange={onChange}
      />,
    );

    const image = screen.getByRole("img", { name: "Vorschaubild" });
    expect(image.className).toContain("object-contain");
    expect(image.parentElement?.className).toContain("bg-[#808080]");

    fireEvent.click(screen.getByRole("button"));

    expect(screen.getByDisplayValue("/preview.jpg")).toBeTruthy();
  });
});
