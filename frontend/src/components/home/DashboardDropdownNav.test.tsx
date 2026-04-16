import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const openMock = vi.hoisted(() => vi.fn());

vi.mock("@/components/home/MapComponent", () => ({
  MapComponent: ({
    src,
    className,
  }: {
    src: string;
    className?: string;
  }) => <div data-testid="map-component" data-src={src} className={className} />,
}));

vi.mock("@/components/home/InfoCard/InfoCard", () => ({
  InfoCard: ({ card }: { card: { title: string } }) => <div>{card.title}</div>,
}));

vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
  DropdownMenuContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({
    children,
    onClick,
  }: {
    children: ReactNode;
    onClick?: () => void;
  }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    className,
  }: {
    children: ReactNode;
    className?: string;
  }) => (
    <button type="button" className={className}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

describe("DashboardDropdownTabs", () => {
  beforeEach(() => {
    openMock.mockReset();
    vi.stubGlobal("open", openMock);
  });

  it("defaults to the first tab and renders the responsive map and cards layout", async () => {
    const { DashboardDropdownTabs } = await import("./DashboardDropdownNav");

    render(
      <DashboardDropdownTabs
        dropdowns={[
          {
            id: "dropdown-1",
            title: "Services",
            isLink: false,
            tabs: [
              {
                id: "tab-1",
                title: "Tab One",
                mapUrl: "https://example.com/map-1",
                informationCards: [{ title: "Card One" }],
              },
              {
                id: "tab-2",
                title: "Tab Two",
                mapUrl: "https://example.com/map-2",
                informationCards: [{ title: "Card Two" }],
              },
            ],
          },
        ]}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("map-component").getAttribute("data-src")).toBe("https://example.com/map-1");
    });

    expect(screen.getByText("Card One")).toBeTruthy();
    expect(screen.getByTestId("map-component").className).toContain("min-h-[18rem]");
  });

  it("switches tabs and opens external links from link dropdowns", async () => {
    const { DashboardDropdownTabs } = await import("./DashboardDropdownNav");

    render(
      <DashboardDropdownTabs
        dropdowns={[
          {
            id: "dropdown-1",
            title: "Services",
            isLink: false,
            tabs: [
              {
                id: "tab-1",
                title: "Tab One",
                mapUrl: "https://example.com/map-1",
                informationCards: [{ title: "Card One" }],
              },
              {
                id: "tab-2",
                title: "Tab Two",
                mapUrl: "https://example.com/map-2",
                informationCards: [{ title: "Card Two" }],
              },
            ],
          },
          {
            id: "dropdown-2",
            title: "Links",
            isLink: true,
            links: [{ id: "link-1", title: "External Link", link: "https://example.com" }],
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Tab Two" }));

    await waitFor(() => {
      expect(screen.getByTestId("map-component").getAttribute("data-src")).toBe("https://example.com/map-2");
    });

    fireEvent.click(screen.getByRole("button", { name: "External Link" }));
    expect(openMock).toHaveBeenCalledWith("https://example.com", "_blank");
  });
});
