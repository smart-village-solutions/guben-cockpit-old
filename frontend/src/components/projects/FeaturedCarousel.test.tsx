import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FeaturedCarousel } from "./FeaturedCarousel";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        ReadMore: "Mehr erfahren",
      })[key] ?? key,
  }),
}));

vi.mock("swiper/react", () => ({
  Swiper: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SwiperSlide: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("swiper/modules", () => ({
  Navigation: {},
  Pagination: {},
  Autoplay: {},
}));

describe("FeaturedCarousel", () => {
  it("keeps the headline link and adds a localized CTA link below it", () => {
    const { container } = render(
      <FeaturedCarousel
        slides={[
          {
            id: "project-1",
            image: "/project.jpg",
            icon: "/icon.jpg",
            iconColor: "66a120",
            title: "Projekt 1",
            description: "Kurzbeschreibung",
            link: "/projects/project-1",
          },
        ]}
      />,
    );

    expect(screen.getByRole("link", { name: "Projekt 1" }).getAttribute("href")).toBe("/projects/project-1");
    expect(screen.getByRole("link", { name: "Mehr erfahren >" }).getAttribute("href")).toBe("/projects/project-1");
    expect(screen.getByText("Kurzbeschreibung")).toBeTruthy();
    expect(screen.getAllByRole("img", { name: "Projekt 1" })[0].className).toContain("object-contain");
    expect(container.querySelector(".bg-\\[\\#808080\\]")).toBeTruthy();
  });
});
