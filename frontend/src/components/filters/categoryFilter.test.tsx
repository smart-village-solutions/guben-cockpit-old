import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

import { CategoryFilter } from "./categoryFilter";

describe("CategoryFilter", () => {
  it("does not automatically select a sole option", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <CategoryFilter
        value={null}
        onChange={onChange}
        categories={[{ id: "theater", name: "Theater" }]}
      />,
    );

    expect(onChange).not.toHaveBeenCalled();

    rerender(
      <CategoryFilter
        value={null}
        onChange={onChange}
        categories={[
          { id: "sport", name: "Sport" },
          { id: "ausstellung", name: "Ausstellung" },
        ]}
      />,
    );

    expect(onChange).not.toHaveBeenCalled();
  });
});
