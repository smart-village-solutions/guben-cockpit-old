import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const locationState = vi.hoisted(() => ({
  pathname: "/map",
}));

const updateLanguageMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    className,
    target,
  }: {
    children: React.ReactNode;
    to: string;
    className?: string;
    target?: string;
  }) => (
    <a href={to} className={className} target={target}>
      {children}
    </a>
  ),
  useLocation: () => locationState,
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("i18next", () => ({
  default: {
    language: "de",
  },
}));

vi.mock("@/components/general/Tooltip", () => ({
  CustomTooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/utilities/i18n/Languages", () => ({
  Language: {
    de: "de",
    en: "en",
    pl: "pl",
  },
  getLocalizedLanguagename: (language: string) => `lang-${language}`,
}));

vi.mock("@/hooks/useLanguageUpdater", () => ({
  useLanguageUpdater: () => updateLanguageMock,
}));

vi.mock("../icons", () => ({
  ServicePortalIcon: ({ className }: { className?: string }) => <svg data-testid="service-portal-icon" className={className} />,
  SmartCityGubenLogoIcon: ({ className }: { className?: string }) => <svg data-testid="logo-icon" className={className} />,
}));

vi.mock("../icons/MyGubenIcon", () => ({
  MyGubenIcon: ({ className }: { className?: string }) => <svg data-testid="my-guben-icon" className={className} />,
}));

vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({
    children,
    onClick,
    className,
  }: {
    children: React.ReactNode;
    onClick?: () => void | Promise<void>;
    className?: string;
  }) => (
    <button type="button" onClick={() => void onClick?.()} className={className}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    className,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button" className={className} {...props}>
      {children}
    </button>
  ),
}));

describe("Navbar", () => {
  beforeEach(() => {
    locationState.pathname = "/map";
    updateLanguageMock.mockReset();
  });

  it("renders a correctly labeled mobile navigation without nested list items", async () => {
    const { Navbar } = await import("./Navbar");

    const { container } = render(<Navbar />);

    const nav = screen.getByLabelText("Main navigation");
    expect(nav).toBeTruthy();
    expect(container.querySelectorAll("nav ul > li").length).toBe(6);
    expect(container.querySelector("nav ul > li > li")).toBeNull();
  }, 15_000);

  it("marks the active route and allows changing the language", async () => {
    const { Navbar } = await import("./Navbar");

    render(<Navbar />);

    const mapLinks = screen.getAllByRole("link", { name: /Map/i });
    expect(mapLinks.some((link) => link.className.includes("bg-gubenAccent"))).toBe(true);

    fireEvent.click(screen.getAllByRole("button", { name: "lang-en" })[0]);
    expect(updateLanguageMock).toHaveBeenCalledWith("en");
  }, 15_000);
});
