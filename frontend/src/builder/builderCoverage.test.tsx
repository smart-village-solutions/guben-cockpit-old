import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const builderState = vi.hoisted(() => ({
  apiKey: "builder-key",
  model: "page",
  previewUrl: "/",
  isPreviewing: false,
  entry: { data: { title: "Builder Title" } } as any,
  error: null as Error | null,
}));

const builderGet = vi.hoisted(() =>
  vi.fn(() => ({
    promise: async () => {
      if (builderState.error) {
        throw builderState.error;
      }
      return builderState.entry;
    },
  })),
);

vi.mock("@builder.io/react", () => ({
  BuilderComponent: ({ model, content }: { model: string; content?: { data?: { title?: string } } }) => (
    <div>
      BuilderComponent {model} {content?.data?.title ?? "empty"}
    </div>
  ),
  builder: {
    get: builderGet,
  },
  useIsPreviewing: () => builderState.isPreviewing,
}));

vi.mock("@/builder/config", () => ({
  get builderPublicApiKey() {
    return builderState.apiKey;
  },
  get builderModel() {
    return builderState.model;
  },
  get builderPreviewUrl() {
    return builderState.previewUrl;
  },
}));

vi.mock("@/builder/registry", () => ({}));

describe("builder coverage", () => {
  beforeEach(() => {
    builderState.apiKey = "builder-key";
    builderState.model = "page";
    builderState.previewUrl = "/";
    builderState.isPreviewing = false;
    builderState.entry = { data: { title: "Builder Title" } };
    builderState.error = null;
    builderGet.mockClear();
    window.history.pushState({}, "", "/builder-preview?url=/demo");
  });

  it("renders disabled builder preview state", async () => {
    const module = await import("@/builder/BuilderPreviewDisabled");
    render(<module.default />);
    expect(screen.getByText("Builder-Vorschau ist im Deploy deaktiviert")).toBeTruthy();
  });

  it("renders builder preview content when content is available", async () => {
    const module = await import("@/builder/BuilderPreviewContent");
    render(<module.default />);

    expect(await screen.findByText("Preview-URL:")).toBeTruthy();
    expect(await screen.findByText(/BuilderComponent page Builder Title/)).toBeTruthy();
    expect(document.title).toBe("Builder Title");
  });

  it("renders missing api key state", async () => {
    builderState.apiKey = "";
    const module = await import("@/builder/BuilderPreviewContent");
    render(<module.default />);

    expect(await screen.findByText("Builder.io ist noch nicht konfiguriert")).toBeTruthy();
  });

  it("renders empty-content and error states", async () => {
    const module = await import("@/builder/BuilderPreviewContent");

    builderState.entry = null;
    const firstRender = render(<module.default />);
    expect(await screen.findByText("Kein Builder-Inhalt gefunden")).toBeTruthy();

    firstRender.unmount();
    builderState.error = new Error("kaputt");
    render(<module.default />);
    expect(await screen.findByText("Builder-Inhalt konnte nicht geladen werden")).toBeTruthy();
  });
});
