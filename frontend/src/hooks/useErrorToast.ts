import { ApiErrorResult } from "@/types/ApiErrorResult";
import { toast } from "sonner";

const extractErrorPayload = (error: unknown): Record<string, unknown> | null => {
  if (!error || typeof error !== "object") {
    return null;
  }

  if ("payload" in error && error.payload && typeof error.payload === "object") {
    return error.payload as Record<string, unknown>;
  }

  return error as Record<string, unknown>;
};

export const useErrorToast = (error: ApiErrorResult | Error | unknown) => {
  const payload = extractErrorPayload(error);
  if (!payload) {
    toast("An error occurred");
    return;
  }

  const message = typeof payload.title === "string" ? payload.title : "An error occurred";
  const details = typeof payload.detail === "string" ? payload.detail : "reason unknown";

  toast(message, {
    description: details,
  });
};
