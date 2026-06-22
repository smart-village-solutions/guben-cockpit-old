import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DistanceFilter } from "./DistanceFilter";

const comboboxMock = vi.hoisted(() => vi.fn());

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/components/ui/label", () => ({
  Label: ({ children }: { children: ReactNode }) => <label>{children}</label>,
}));

vi.mock("../ui/comboBox", () => ({
  Combobox: (props: unknown) => {
    comboboxMock(props);
    return <div>Combobox</div>;
  },
}));

describe("DistanceFilter", () => {
  it("does not default to 10 km when no radius is set", () => {
    render(<DistanceFilter onChange={() => undefined} />);

    expect(screen.getByText("Radius")).toBeTruthy();
    expect(comboboxMock).toHaveBeenCalledWith(
      expect.objectContaining({
        value: undefined,
        placeholder: "Radius",
      }),
    );
  });
});
