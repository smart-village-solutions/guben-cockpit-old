import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BookingApiError } from "@/booking-api/errors";
import { BookingErrorState } from "./BookingErrorState";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (key === "errorState.httpStatus") {
        return `HTTP-Status: ${options?.status}`;
      }
      return key;
    },
  }),
}));

describe("BookingErrorState", () => {
  it("hides retry for non-retryable booking api errors", () => {
    render(
      <BookingErrorState
        error={
          new BookingApiError({
            code: "BOOKING_API_CONFIG_ERROR",
            message: "config kaputt",
            retryable: false,
          })
        }
        onRetry={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText("errorState.title.overview")).toBeTruthy();
  });

  it("renders retry and calls it for retryable errors", () => {
    const onRetry = vi.fn();

    render(
      <BookingErrorState
        error={
          new BookingApiError({
            code: "BOOKING_API_HTTP_ERROR",
            message: "http kaputt",
            retryable: true,
            status: 503,
          })
        }
        onRetry={onRetry}
        scope="detail"
      />,
    );

    fireEvent.click(screen.getByRole("button"));

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(screen.getByText("errorState.title.detail")).toBeTruthy();
    expect(screen.getByText("HTTP-Status: 503")).toBeTruthy();
  });
});
