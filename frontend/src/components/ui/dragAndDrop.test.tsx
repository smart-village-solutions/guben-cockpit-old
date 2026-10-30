import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DragAndDrop } from "./dragAndDrop";

describe("DragAndDrop", () => {
  it("opens the file picker once when the dropzone is activated with the keyboard", async () => {
    const user = userEvent.setup();
    const { container } = render(<DragAndDrop file={null} onFileSelected={vi.fn()} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const openPicker = vi.spyOn(input, "click");
    const dropzone = screen.getByRole("button", { name: "File dropzone" });

    expect(dropzone.tagName).toBe("BUTTON");
    expect(dropzone.querySelector("button, input")).toBeNull();
    await user.tab();
    await user.keyboard("{Enter}");
    expect(openPicker).toHaveBeenCalledTimes(1);
    await user.keyboard(" ");
    expect(openPicker).toHaveBeenCalledTimes(2);
  });

  it("accepts a dropped file and rejects a file with an unsupported extension", () => {
    const onFileSelected = vi.fn();
    render(<DragAndDrop file={null} onFileSelected={onFileSelected} acceptExtensions={[".geojson"]} />);
    const dropzone = screen.getByRole("button", { name: "File dropzone" });
    const file = new File(["{}"], "map.geojson");

    fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });
    expect(onFileSelected).toHaveBeenLastCalledWith(file);
    fireEvent.drop(dropzone, { dataTransfer: { files: [new File(["text"], "map.txt")] } });
    expect(onFileSelected).toHaveBeenLastCalledWith(null);
  });

  it("prevents file browsing and drops while disabled", async () => {
    const user = userEvent.setup();
    const onFileSelected = vi.fn();
    const { container } = render(<DragAndDrop file={null} onFileSelected={onFileSelected} disabled />);
    const openPicker = vi.spyOn(container.querySelector("input") as HTMLInputElement, "click");
    const dropzone = screen.getByRole("button", { name: "File dropzone" });

    await user.click(dropzone);
    fireEvent.drop(dropzone, { dataTransfer: { files: [new File(["{}"], "map.geojson")] } });
    expect(openPicker).not.toHaveBeenCalled();
    expect(onFileSelected).not.toHaveBeenCalled();
  });
});
