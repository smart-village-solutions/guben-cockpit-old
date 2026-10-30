import type { PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ language: "de" }));
const fetchGatewayJson = vi.hoisted(() => vi.fn());

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ i18n: { language: state.language } }),
}));

vi.mock("./client", async (importOriginal) => ({ ...await importOriginal<typeof import("./client")>(), fetchGatewayJson }));

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

it("automatically refreshes pending content and stops when unchanged content is complete", async () => {
  fetchGatewayJson.mockReset().mockResolvedValueOnce({ items: [], translationPending: true }).mockResolvedValue({ items: [], translationPending: false });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: PropsWithChildren) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const hook = renderHook(() => useGatewayBookingFaqs(), { wrapper });
  try {
    await waitFor(() => expect(hook.result.current.data).toMatchObject({ translationPending: false }), { timeout: 4000 });
    expect(fetchGatewayJson).toHaveBeenCalledTimes(2);
    await new Promise((resolve) => setTimeout(resolve, 1700));
    expect(fetchGatewayJson).toHaveBeenCalledTimes(2);
  } finally { hook.unmount(); client.clear(); }
}, 10000);
