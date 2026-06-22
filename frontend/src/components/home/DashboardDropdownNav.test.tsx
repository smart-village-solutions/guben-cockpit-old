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
  const createInfoCard = (id: string, title: string) => ({
    id,
    title,
    description: null,
    imageUrl: null,
    imageAlt: null,
    button: null,
  });

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
            title: "Stadtleben",
            rank: 1,
            isLink: false,
            tabs: [
              {
                id: "tab-1",
                title: "Mobilität",
                sequence: 1,
                mapUrl: "https://example.com/map-1",
                informationCards: [createInfoCard("card-1", "Card One")],
              },
              {
                id: "tab-2",
                title: "Freizeit",
                sequence: 2,
                mapUrl: "https://example.com/map-2",
                informationCards: [createInfoCard("card-2", "Card Two")],
              },
            ],
            links: [],
          },
        ]}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("map-component").getAttribute("data-src")).toBe("https://example.com/map-1");
    });

    expect(screen.getByText("Wählen Sie Ihre Themenkarte:")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /Mobilität/i })).toHaveLength(2);
    expect(screen.getByText("Card One")).toBeTruthy();
    expect(screen.getByTestId("map-component").className).toContain("min-h-[18rem]");
  }, 15_000);

  it("lists grouped options in one dropdown, switches tabs and opens external links", async () => {
    const { DashboardDropdownTabs } = await import("./DashboardDropdownNav");

    render(
      <DashboardDropdownTabs
        dropdowns={[
          {
            id: "dropdown-1",
            title: "Stadtleben",
            rank: 1,
            isLink: false,
            tabs: [
              {
                id: "tab-1",
                title: "Mobilität",
                sequence: 1,
                mapUrl: "https://example.com/map-1",
                informationCards: [createInfoCard("card-1", "Card One")],
              },
              {
                id: "tab-2",
                title: "Freizeit",
                sequence: 2,
                mapUrl: "https://example.com/map-2",
                informationCards: [createInfoCard("card-2", "Card Two")],
              },
            ],
            links: [],
          },
          {
            id: "dropdown-2",
            title: "Service",
            rank: 2,
            isLink: true,
            tabs: [],
            links: [{ id: "link-1", title: "Bürgerdienste", link: "https://example.com", sequence: 1 }],
          },
        ]}
      />,
    );

    expect(screen.getByText("Stadtleben")).toBeTruthy();
    expect(screen.getByText("Service")).toBeTruthy();
    expect(screen.getAllByText("Mobilität")).toHaveLength(2);
    expect(screen.getByText("Freizeit")).toBeTruthy();
    expect(screen.getByText("Bürgerdienste")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Freizeit" }));

    await waitFor(() => {
      expect(screen.getByTestId("map-component").getAttribute("data-src")).toBe("https://example.com/map-2");
    });

    fireEvent.click(screen.getByRole("button", { name: "Bürgerdienste" }));
    expect(openMock).toHaveBeenCalledWith("https://example.com", "_blank", "noopener,noreferrer");
  });
});
