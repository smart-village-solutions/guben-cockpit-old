import type { PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ language: "de" }));
const fetchGatewayJson = vi.hoisted(() => vi.fn());

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ i18n: { language: state.language } }),
}));

vi.mock("./client", () => ({ fetchGatewayJson }));

import { useGatewayBookingFaqs } from "./hooks";

describe("useGatewayBookingFaqs", () => {
  beforeEach(() => {
    state.language = "de";
    fetchGatewayJson.mockReset().mockResolvedValue({ items: [] });
  });

  it("keys and requests FAQs by the active content language", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { rerender } = renderHook(() => useGatewayBookingFaqs(), { wrapper });

    await waitFor(() => expect(fetchGatewayJson).toHaveBeenCalledWith(
      "/api/content/booking/faqs",
      expect.anything(),
      { lang: "de" },
    ));

    state.language = "pl";
    rerender();
    await waitFor(() => expect(fetchGatewayJson).toHaveBeenCalledWith(
      "/api/content/booking/faqs",
      expect.anything(),
      { lang: "pl" },
    ));
  });
});
