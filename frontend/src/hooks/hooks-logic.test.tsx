import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { useDebouncedCallback } from "./useDebouncedCallback";
import { useDialogFormToggle } from "./useDialogFormToggle";
import { useErrorToast } from "./useErrorToast";
import { useLanguageUpdater } from "./useLanguageUpdater";
import { usePagination } from "./usePagination";
import { FetchInterceptor } from "@/utilities/fetchApiExtensions";
import i18next from "i18next";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: vi.fn(),
}));

describe("frontend hooks", () => {
  it("manages pagination boundaries and setters", () => {
    const { result } = renderHook(() => usePagination());

    act(() => {
      result.current.setPageCount(3);
      result.current.setTotal(41);
      result.current.setPageSize(20);
    });

    act(() => {
      result.current.nextPage();
      result.current.nextPage();
      result.current.nextPage();
    });

    act(() => {
      result.current.previousPage();
      result.current.setPageIndex(3);
      result.current.setPageIndex(4);
    });

    expect(result.current.page).toBe(3);
    expect(result.current.pageCount).toBe(3);
    expect(result.current.pageSize).toBe(20);
    expect(result.current.total).toBe(41);
  });

  it("debounces callback execution", () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 100));

    act(() => {
      result.current("first");
      result.current("second");
      vi.advanceTimersByTime(99);
    });

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(callback).toHaveBeenCalledWith("second");
    vi.useRealTimers();
  });

  it("resets dialog forms only when closing", () => {
    const reset = vi.fn();
    const setOpen = vi.fn();

    const { result } = renderHook(() => useDialogFormToggle({ reset } as never, setOpen));

    act(() => {
      result.current(true);
      result.current(false);
    });

    expect(reset).toHaveBeenCalledTimes(1);
    expect(setOpen).toHaveBeenNthCalledWith(1, true);
    expect(setOpen).toHaveBeenNthCalledWith(2, false);
  });

  it("updates language, fetch headers and query cache", async () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const setHeader = vi.spyOn(FetchInterceptor, "setHeader").mockImplementation(() => {});
    const changeLanguage = vi.spyOn(i18next, "changeLanguage").mockResolvedValue(i18next.t);
    const refetchQueries = vi.spyOn(queryClient, "refetchQueries").mockResolvedValue(undefined);

    const { result } = renderHook(() => useLanguageUpdater(), { wrapper });

    await act(async () => {
      await result.current("en");
    });

    expect(setHeader).toHaveBeenCalledWith("Accept-Language", "en");
    expect(changeLanguage).toHaveBeenCalledWith("en");
    expect(refetchQueries).toHaveBeenCalled();
  });

  it("shows normalized error toasts", () => {
    useErrorToast({
      status: 500,
      payload: {
        title: "Fehler",
        detail: "Etwas ist schiefgelaufen",
      },
    });
    useErrorToast(new Error("boom"));
    useErrorToast(null);

    expect(toast).toHaveBeenNthCalledWith(1, "Fehler", {
      description: "Etwas ist schiefgelaufen",
    });
    expect(toast).toHaveBeenNthCalledWith(2, "An error occurred", {
      description: "reason unknown",
    });
    expect(toast).toHaveBeenNthCalledWith(3, "An error occurred");
  });
});
