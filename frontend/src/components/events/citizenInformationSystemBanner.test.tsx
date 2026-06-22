import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import CitizenInformationSystemBanner from "./citizenInformationSystemBanner";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) =>
      key === "CitizenInformationText"
        ? "Wenn Sie auf der Suche nach dem Bürgerinformationssystem sind"
        : "hier klicken",
  }),
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogTrigger: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogContent: ({ children, className }: { children: ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  DialogTitle: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../home/MapComponent", () => ({
  MapComponent: () => <div>Map</div>,
}));

describe("CitizenInformationSystemBanner", () => {
  it("renders the embedded red banner with rounded corners", () => {
    const { container } = render(<CitizenInformationSystemBanner />);

    expect(screen.getByText("Wenn Sie auf der Suche nach dem Bürgerinformationssystem sind")).toBeTruthy();
    expect(container.querySelector(".bg-gubenAccent.rounded-md")).toBeTruthy();
  });
});
