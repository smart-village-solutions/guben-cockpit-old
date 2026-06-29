import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { DetailMediaSection } from "./detailMediaSection";

describe("DetailMediaSection", () => {
  it("renders only the text content when no images are available", () => {
    render(
      <DetailMediaSection
        heading="Beschreibung"
        body={<p>Nur Text</p>}
        images={[]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Beschreibung" })).toBeTruthy();
    expect(screen.getByText("Nur Text")).toBeTruthy();
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.queryByRole("button", { name: "Bild im Vollbild öffnen" })).toBeNull();
  });

  it("renders a single image without slider controls", () => {
    const { container } = render(
      <DetailMediaSection
        heading="Beschreibung"
        body={<p>Ein Bild</p>}
        images={[{ src: "/one.jpg", alt: "Bild 1" }]}
      />,
    );

    expect(screen.getByRole("img", { name: "Bild 1" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Bild 1" }).className).toContain("object-contain");
    const viewer = container.querySelector('[aria-label="Bild im Vollbild öffnen"]')?.parentElement;
    expect(viewer?.className).not.toContain("bg-[#808080]");
    expect(viewer?.className).not.toContain("rounded-2xl");
    expect(viewer?.className).not.toContain("border");
    expect(screen.queryByRole("button", { name: "Vorheriges Bild" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Nächstes Bild" })).toBeNull();
    expect(screen.queryByText("1 / 1")).toBeNull();
  });

  it("supports switching between multiple images and opening fullscreen from the current image", async () => {
    const user = userEvent.setup();

    render(
      <DetailMediaSection
        heading="Beschreibung"
        body={<p>Mit Bildern</p>}
        images={[
          { src: "/one.jpg", alt: "Bild 1" },
          { src: "/two.jpg", alt: "Bild 2" },
        ]}
      />,
    );

    expect(screen.getByText("1 / 2")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Nächstes Bild" }));

    expect(screen.getByText("2 / 2")).toBeTruthy();
    expect(screen.getAllByRole("img", { name: "Bild 2" })[0]).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Bild im Vollbild öffnen" }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeTruthy();
    expect(within(dialog).getByRole("img", { name: "Bild 2" })).toBeTruthy();
    expect(within(dialog).getByRole("button", { name: "Close" }).className).toContain("bg-black/70");
    const fullscreenViewer = within(dialog).getByRole("img", { name: "Bild 2" }).parentElement;
    expect(fullscreenViewer?.className).not.toContain("border-neutral-700");
    expect(fullscreenViewer?.className).not.toContain("bg-transparent");
  }, 15_000);

  it("clamps the selected image when a rerender provides fewer images", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <DetailMediaSection
        heading="Beschreibung"
        body={<p>Mit Bildern</p>}
        images={[
          { src: "/one.jpg", alt: "Bild 1" },
          { src: "/two.jpg", alt: "Bild 2" },
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Nächstes Bild" }));
    expect(screen.getByText("2 / 2")).toBeTruthy();

    rerender(
      <DetailMediaSection
        heading="Beschreibung"
        body={<p>Mit nur einem Bild</p>}
        images={[{ src: "/only.jpg", alt: "Einziges Bild" }]}
      />,
    );

    expect(screen.getByRole("img", { name: "Einziges Bild" })).toBeTruthy();
    expect(screen.queryByText("2 / 2")).toBeNull();
  });
});
