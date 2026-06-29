import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/builder/BuilderPreviewContent", () => ({
  default: () => <div>BuilderPreviewContent</div>,
}));

describe("BuilderPreviewEntry", () => {
  it("re-exports the preview content component", async () => {
    const module = await import("@/builder/BuilderPreviewEntry");
    render(<module.default />);

    expect(screen.getByText("BuilderPreviewContent")).toBeTruthy();
  });
});
