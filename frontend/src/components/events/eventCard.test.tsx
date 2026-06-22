import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import "@/utilities/dateExtensions";

import EventCard from "./eventCard";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/utilities/translateUtils", () => ({
  TranslatedHtml: ({ text, className }: { text: string; className?: string }) => (
    <div className={className}>{text}</div>
  ),
  TranslatedText: ({ text }: { text: string }) => <>{text}</>,
}));

vi.mock("@/components/ui/GenericCard", () => ({
  GenericCard: ({
    customImageElement,
    title,
    buttonLabel,
  }: {
    customImageElement?: React.ReactNode;
    title: string;
    buttonLabel: string;
  }) => (
    <div>
      <div>{customImageElement}</div>
      <h2>{title}</h2>
      <span>{buttonLabel}</span>
    </div>
  ),
}));

describe("eventCard", () => {
  it("renders event images inside a gray contain-based media frame", () => {
    render(
      <EventCard
        event={{
          id: "event-1",
          eventId: "event-1",
          terminId: "termin-1",
          title: "Sommerfest",
          description: "Beschreibung",
          startDate: "2026-06-01T10:00:00",
          endDate: "2026-06-01T12:00:00",
          location: {
            id: "location-1",
            name: "Altstadt",
            street: "Musterstrasse 1",
            zip: "03172",
            city: "Guben",
            telephoneNumber: null,
            fax: null,
            email: null,
            website: null,
          },
          coordinates: {
            latitude: 51.95,
            longitude: 14.71,
          },
          urls: [],
          categories: [{ id: "category-1", name: "Fest" }],
          images: [
            {
              thumbnailUrl: "/thumb.jpg",
              previewUrl: "/preview.jpg",
              originalUrl: "/image.jpg",
            },
          ],
          published: true,
        }}
      />,
    );

    const image = screen.getByRole("img", { name: "Event" });
    expect(image.className).toContain("object-contain");
    expect(image.parentElement?.className).toContain("bg-[#808080]");
  });

  it("moves forward in the image carousel when the next button is clicked", () => {
    render(
      <EventCard
        event={{
          id: "event-1",
          eventId: "event-1",
          terminId: "termin-1",
          title: "Sommerfest",
          description: "Beschreibung",
          startDate: "2026-06-01T10:00:00",
          endDate: "2026-06-01T12:00:00",
          location: {
            id: "location-1",
            name: "Altstadt",
            street: "Musterstrasse 1",
            zip: "03172",
            city: "Guben",
            telephoneNumber: null,
            fax: null,
            email: null,
            website: null,
          },
          coordinates: {
            latitude: 51.95,
            longitude: 14.71,
          },
          urls: [],
          categories: [{ id: "category-1", name: "Fest" }],
          images: [
            {
              thumbnailUrl: "/thumb-1.jpg",
              previewUrl: "/preview-1.jpg",
              originalUrl: "/image-1.jpg",
            },
            {
              thumbnailUrl: "/thumb-2.jpg",
              previewUrl: "/preview-2.jpg",
              originalUrl: "/image-2.jpg",
            },
          ],
          published: true,
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Next image" }));

    expect(screen.getByRole("img", { name: "Event" }).getAttribute("src")).toBe("/preview-2.jpg");
  });

  it("moves back in the image carousel when the previous button is clicked", () => {
    render(
      <EventCard
        event={{
          id: "event-1",
          eventId: "event-1",
          terminId: "termin-1",
          title: "Sommerfest",
          description: "Beschreibung",
          startDate: "2026-06-01T10:00:00",
          endDate: "2026-06-01T12:00:00",
          location: {
            id: "location-1",
            name: "Altstadt",
            street: "Musterstrasse 1",
            zip: "03172",
            city: "Guben",
            telephoneNumber: null,
            fax: null,
            email: null,
            website: null,
          },
          coordinates: {
            latitude: 51.95,
            longitude: 14.71,
          },
          urls: [],
          categories: [{ id: "category-1", name: "Fest" }],
          images: [
            {
              thumbnailUrl: "/thumb-1.jpg",
              previewUrl: "/preview-1.jpg",
              originalUrl: "/image-1.jpg",
            },
            {
              thumbnailUrl: "/thumb-2.jpg",
              previewUrl: "/preview-2.jpg",
              originalUrl: "/image-2.jpg",
            },
          ],
          published: true,
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Next image" }));
    fireEvent.click(screen.getByRole("button", { name: "Previous image" }));

    expect(screen.getByRole("img", { name: "Event" }).getAttribute("src")).toBe("/preview-1.jpg");
  });
});
