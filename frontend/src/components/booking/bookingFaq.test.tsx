import { render, screen, waitFor } from "@testing-library/react";
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
});
