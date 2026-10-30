import { fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "./carousel";

const embla = vi.hoisted(() => {
  const api = {
    canScrollPrev: vi.fn(() => false),
    canScrollNext: vi.fn(() => true),
    scrollPrev: vi.fn(),
    scrollNext: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  };
  return { api, ref: vi.fn(), useCarousel: vi.fn() };
});
vi.mock("embla-carousel-react", () => ({ default: embla.useCarousel }));

beforeEach(() => {
  vi.clearAllMocks();
  embla.api.canScrollPrev.mockReturnValue(false);
  embla.api.canScrollNext.mockReturnValue(true);
  embla.useCarousel.mockReturnValue([embla.ref, embla.api]);
});

describe("Carousel", () => {
  it("exposes a named region and slide groups and connects button and keyboard navigation", () => {
    const setApi = vi.fn();
    const slideRef = createRef<HTMLFieldSetElement>();
    const { unmount } = render(
      <Carousel setApi={setApi} aria-label="Project pictures">
        <CarouselContent><CarouselItem ref={slideRef} aria-label="Picture 1">First image</CarouselItem></CarouselContent>
        <CarouselPrevious /><CarouselNext />
      </Carousel>,
    );
    const region = screen.getByRole("region", { name: "Project pictures" });
    expect(region.tagName).toBe("SECTION");
    expect(screen.getByRole("group", { name: "Picture 1" })).toBe(slideRef.current);
    expect(slideRef.current?.tagName).toBe("FIELDSET");
    expect(setApi).toHaveBeenCalledWith(embla.api);
    expect((screen.getByRole("button", { name: "Previous slide" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Next slide" }) as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Next slide" }));
    fireEvent.keyDown(region, { key: "ArrowRight" });
    expect(embla.api.scrollNext).toHaveBeenCalledTimes(2);
    fireEvent.keyDown(region, { key: "ArrowLeft" });
    expect(embla.api.scrollPrev).toHaveBeenCalledOnce();
    fireEvent.keyDown(region, { key: "Enter" });
    expect(embla.api.scrollNext).toHaveBeenCalledTimes(2);
    unmount();
    expect(embla.api.off).toHaveBeenCalledWith("select", expect.any(Function));
  });

  it("uses the vertical axis and allows previous navigation when the engine reports it", () => {
    embla.api.canScrollPrev.mockReturnValue(true);
    embla.api.canScrollNext.mockReturnValue(false);
    render(<Carousel orientation="vertical"><CarouselContent><CarouselItem>First image</CarouselItem></CarouselContent><CarouselPrevious /><CarouselNext /></Carousel>);
    expect(embla.useCarousel).toHaveBeenCalledWith(expect.objectContaining({ axis: "y" }), undefined);
    const previous = screen.getByRole("button", { name: "Previous slide" }) as HTMLButtonElement;
    expect(previous.disabled).toBe(false);
    expect((screen.getByRole("button", { name: "Next slide" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(previous);
    expect(embla.api.scrollPrev).toHaveBeenCalledOnce();
  });

  it("renders safely while the carousel engine is not initialized", () => {
    const setApi = vi.fn();
    embla.useCarousel.mockReturnValue([embla.ref, undefined]);
    render(<Carousel setApi={setApi}><CarouselContent><CarouselItem>First image</CarouselItem></CarouselContent><CarouselNext /></Carousel>);
    expect(screen.getByRole("region", { name: "Carousel" })).toBeTruthy();
    expect(setApi).not.toHaveBeenCalled();
    expect((screen.getByRole("button", { name: "Next slide" }) as HTMLButtonElement).disabled).toBe(true);
  });
});
