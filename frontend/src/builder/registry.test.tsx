import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const registryState = vi.hoisted(() => ({
  init: vi.fn(),
  registerComponent: vi.fn(),
}));

vi.mock("@builder.io/react", () => ({
  Builder: {
    registerComponent: registryState.registerComponent,
  },
  builder: {
    init: registryState.init,
  },
}));

vi.mock("./config", () => ({
  builderPublicApiKey: "builder-public-key",
}));

describe("builder registry", () => {
  beforeEach(() => {
    registryState.init.mockClear();
    registryState.registerComponent.mockClear();
    vi.resetModules();
  });

  it("registers builder components and renders the feature card image in contain mode", async () => {
    await import("./registry");

    expect(registryState.init).toHaveBeenCalledWith("builder-public-key");
    expect(registryState.registerComponent).toHaveBeenCalledTimes(2);

    const featureRegistration = registryState.registerComponent.mock.calls.find(
      ([, config]) => config.name === "Feature Card",
    );
    expect(featureRegistration).toBeTruthy();

    const FeatureCard = featureRegistration?.[0] as React.ComponentType<{
      title: string;
      imageUrl?: string;
      imageAlt?: string;
    }>;

    const { container } = render(
      <FeatureCard
        title="Projekt"
        imageUrl="/project.jpg"
        imageAlt="Projektbild"
      />,
    );

    expect(screen.getByRole("img", { name: "Projektbild" }).className).toContain("object-contain");
    expect(container.querySelector(".bg-\\[\\#808080\\]")).toBeTruthy();
  });
});
