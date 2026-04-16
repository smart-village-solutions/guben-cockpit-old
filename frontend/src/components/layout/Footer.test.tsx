import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const footerState = vi.hoisted(() => ({
  enabled: true,
  isPending: false,
  items: [
    {
      name: "About Guben",
      content: "<p>Footer content</p>",
    },
  ],
}));

vi.mock("@/public-content/source", () => ({
  get isGatewayPublicContentEnabled() {
    return footerState.enabled;
  },
}));

vi.mock("@/public-content/hooks", () => ({
  useGatewayFooterContent: () => ({
    data: { items: footerState.items },
    isPending: footerState.isPending,
  }),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        "Footer.PrivacyPolicy.name": "Datenschutz",
        "Footer.PrivacyPolicy.url": "/privacy",
        "Footer.Imprint.name": "Impressum",
        "Footer.Imprint.url": "/imprint",
        "Footer.Accessibility.name": "Barrierefreiheit",
        "Footer.Accessibility.url": "/accessibility",
        "Footer.Contact.name": "Kontakt",
        "Footer.Contact.url": "/contact",
      })[key] ?? key,
  }),
}));

vi.mock("@/components/ui/BaseImgTag", () => ({
  BaseImgTag: ({ alt, src, className }: { alt?: string; src: string; className?: string }) => (
    <img alt={alt} src={src} className={className} />
  ),
}));

vi.mock("../loadingIndicator/loadingIndicator", () => ({
  LoadingIndicator: () => <div>Loading</div>,
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogTrigger: ({ children }: { children: ReactNode }) => <button type="button">{children}</button>,
  DialogContent: ({
    children,
    className,
  }: {
    children: ReactNode;
    className?: string;
  }) => <div className={className}>{children}</div>,
  DialogHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogTitle: ({
    children,
    className,
  }: {
    children: ReactNode;
    className?: string;
  }) => <h2 className={className}>{children}</h2>,
  DialogDescription: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

describe("Footer", () => {
  beforeEach(() => {
    footerState.enabled = true;
    footerState.isPending = false;
    footerState.items = [
      {
        name: "About Guben",
        content: "<p>Footer content</p>",
      },
    ];
  });

  it("renders the disabled footer state", async () => {
    footerState.enabled = false;
    const { Footer } = await import("./Footer");

    render(<Footer />);

    expect(screen.getByText("Oeffentliche Inhalte deaktiviert")).toBeTruthy();
  });

  it("renders footer items and legal links in the responsive footer", async () => {
    const { Footer } = await import("./Footer");

    render(<Footer />);

    expect(screen.getByRole("button", { name: "About Guben" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Datenschutz" }).getAttribute("href")).toBe("/privacy");
    expect(screen.getByRole("link", { name: "Impressum" }).getAttribute("href")).toBe("/imprint");
    expect(screen.getByRole("link", { name: "Barrierefreiheit" }).getAttribute("href")).toBe("/accessibility");
    expect(screen.getByRole("link", { name: "Kontakt" }).getAttribute("href")).toBe("/contact");
  });

  it("renders the footer item dialog content with mobile-friendly spacing classes", async () => {
    const module = await import("./Footer");

    render(
      <module.default
        footerItem={{ name: "About Guben", content: "<p>Footer content</p>" } as never}
      />,
    );

    expect(screen.getAllByText("About Guben")).toHaveLength(2);
    expect(screen.getByText("Footer content")).toBeTruthy();
    expect(document.querySelector(".p-4")).toBeTruthy();
  });
});
