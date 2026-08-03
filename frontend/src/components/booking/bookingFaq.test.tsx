import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const translationState = vi.hoisted(() => ({
  items: [
    {
      question: "Frage 1",
      answer: "Kurze Antwort",
    },
    {
      question: "Frage 2",
      answer: "Lange Antwort",
    },
  ] as Array<{ question: string; answer: string }>,
}));

const faqQueryState = vi.hoisted(() => ({
  data: undefined as undefined | { items: Array<{ id: string; question: string; answer: string; languageCode: string; sortWeight: number }> },
  isError: false,
}));

vi.mock("@/public-content/hooks", () => ({
  useGatewayBookingFaqs: () => faqQueryState,
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { returnObjects?: boolean }) => {
      if (key === "faq.items" && options?.returnObjects) {
        return translationState.items;
      }

      const translations: Record<string, string> = {
        "faq.title": "Häufig gestellte Fragen",
        "faq.showMore": "Mehr anzeigen",
        "faq.showLess": "Weniger anzeigen",
      };

      return translations[key] ?? key;
    },
  }),
}));

import BookingFaq from "@/components/booking/bookingFaq";

describe("BookingFaq", () => {
  beforeEach(() => {
    translationState.items = [
      {
        question: "Frage 1",
        answer: "Kurze Antwort",
      },
      {
        question: "Frage 2",
        answer: "Lange Antwort",
      },
    ];

    vi.restoreAllMocks();
    faqQueryState.data = undefined;
    faqQueryState.isError = false;
  });

  it("prefers API FAQs and sanitizes safe and unsafe HTML", () => {
    faqQueryState.data = {
      items: [{
        id: "api-1",
        question: "API-Frage",
        answer: '<strong>Erlaubt</strong><img src="x" onerror="alert(1)"><script>evil()</script>',
        languageCode: "de",
        sortWeight: 1,
      }],
    };

    const { container } = render(<BookingFaq />);
    expect(screen.getByText("API-Frage")).toBeTruthy();
    expect(screen.queryByText("Frage 1")).toBeNull();
    expect(container.querySelector("strong")?.textContent).toBe("Erlaubt");
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("[onerror]")).toBeNull();
  });

  it("renders API plaintext and preserves the gateway order", () => {
    faqQueryState.data = {
      items: [
        { id: "second", question: "Zweite API-Frage", answer: "Zeile eins\nZeile zwei", languageCode: "de", sortWeight: 2 },
        { id: "first", question: "Erste API-Frage", answer: "Antwort", languageCode: "de", sortWeight: 1 },
      ],
    };

    const { container } = render(<BookingFaq />);
    const questions = Array.from(container.querySelectorAll(".text-gubenAccent.font-bold")).map((node) => node.textContent);
    expect(questions).toEqual(["Zweite API-Frage", "Erste API-Frage"]);
    expect(screen.getByText(/Zeile eins/).textContent).toContain("Zeile zwei");
  });

  it("does not show the expand control when an API FAQ is fully visible", async () => {
    faqQueryState.data = {
      items: [{
        id: "short-api-faq",
        question: "Kurze API-Frage",
        answer: "<strong>Kurze Antwort</strong>",
        languageCode: "de",
        sortWeight: 1,
      }],
    };
    vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(40);
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(40);

    render(<BookingFaq />);

    await waitFor(() => expect(screen.getByText("Kurze Antwort")).toBeTruthy());
    expect(screen.queryByRole("button", { name: "Mehr anzeigen" })).toBeNull();
  });

  it("uses localized fallback for errors and successful empty responses", () => {
    faqQueryState.isError = true;
    const { rerender } = render(<BookingFaq />);
    expect(screen.getByText("Frage 1")).toBeTruthy();

    faqQueryState.isError = false;
    faqQueryState.data = { items: [] };
    rerender(<BookingFaq />);
    expect(screen.getByText("Frage 2")).toBeTruthy();
  });

  it("shows the expand button only for answers that overflow the collapsed height", async () => {
    const heightSpy = vi
      .spyOn(HTMLElement.prototype, "scrollHeight", "get")
      .mockImplementation(function getScrollHeight(this: HTMLElement) {
        return this.textContent === "Lange Antwort" ? 80 : 20;
      });

    const clientHeightSpy = vi
      .spyOn(HTMLElement.prototype, "clientHeight", "get")
      .mockImplementation(function getClientHeight(this: HTMLElement) {
        return this.textContent === "Lange Antwort" ? 40 : 20;
      });

    render(<BookingFaq />);

    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: "Mehr anzeigen" })).toHaveLength(1);
    });

    expect(screen.getByText("Frage 1")).toBeTruthy();
    expect(screen.getByText("Frage 2")).toBeTruthy();

    heightSpy.mockRestore();
    clientHeightSpy.mockRestore();
  });

  it("keeps the collapse toggle available after resize while an overflowing answer is expanded", async () => {
    const heightSpy = vi
      .spyOn(HTMLElement.prototype, "scrollHeight", "get")
      .mockImplementation(function getScrollHeight(this: HTMLElement) {
        return this.textContent === "Lange Antwort" ? 80 : 20;
      });

    const clientHeightSpy = vi
      .spyOn(HTMLElement.prototype, "clientHeight", "get")
      .mockImplementation(function getClientHeight(this: HTMLElement) {
        if (this.textContent !== "Lange Antwort") {
          return 20;
        }

        return this.className.includes("line-clamp-2") ? 40 : 80;
      });

    render(<BookingFaq />);

    const expandButton = await screen.findByRole("button", { name: "Mehr anzeigen" });
    fireEvent.click(expandButton);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Weniger anzeigen" })).toBeTruthy();
    });

    fireEvent(window, new Event("resize"));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Weniger anzeigen" })).toBeTruthy();
    });

    heightSpy.mockRestore();
    clientHeightSpy.mockRestore();
  });
});
