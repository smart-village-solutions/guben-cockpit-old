import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { AddIconButton } from "../iconButtons/AddIconButton";
import { FileInput } from "../inputs/FileInput";
import { Dialog } from "./dialog";
import { DetailPageLayout } from "./DetailPageLayout";
import { GenericCard } from "./GenericCard";
import { Table, TableBody, TableCell, TableRow } from "./table";

vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

describe("UI interaction contracts", () => {
  it("calls the plain add action", () => {
    const onClick = vi.fn();
    const { container } = render(<AddIconButton tooltip="Add" onClick={onClick} />);
    fireEvent.click(container.querySelector("svg")!);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("opens a dialog through the enabled add trigger", () => {
    const onOpenChange = vi.fn();
    const { container } = render(<Dialog onOpenChange={onOpenChange}><AddIconButton tooltip="Add" dialogTrigger /></Dialog>);
    fireEvent.click(container.querySelector("svg")!);
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it("keeps the disabled dialog icon inert", () => {
    const onOpenChange = vi.fn();
    const onClick = vi.fn();
    const { container } = render(<Dialog onOpenChange={onOpenChange}><AddIconButton tooltip="Add" disabledTooltip="Unavailable" dialogTrigger disabled onClick={onClick} /></Dialog>);
    fireEvent.click(container.querySelector("svg")!);
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(onClick).not.toHaveBeenCalled();
  });

  it("prioritizes the empty table message over loading and renders rows when populated", () => {
    const { container, rerender } = render(<Table><TableBody data={[]} isLoading /></Table>);
    expect(screen.getByText("NoResults")).toBeTruthy();
    expect(container.querySelector(".animate-spin")).toBeNull();
    rerender(<Table><TableBody data={[1]} isLoading /></Table>);
    expect(screen.queryByText("NoResults")).toBeNull();
    expect(container.querySelector(".animate-spin")).toBeTruthy();
    rerender(<Table><TableBody data={[1]}><TableRow><TableCell>Actual record</TableCell></TableRow></TableBody></Table>);
    expect(screen.getByRole("cell", { name: "Actual record" })).toBeTruthy();
    expect(container.querySelector(".animate-spin")).toBeNull();
  });

  it("retains each remaining file's input identity after removal and reorder even for matching names", () => {
    const first = new File(["first"], "same.pdf");
    const second = new File(["second"], "same.pdf");
    const third = new File(["third"], "other.pdf");
    function Files() {
      const [files, setFiles] = useState([first, second, third]);
      return <><FileInput files={files} setFiles={setFiles} /><button onClick={() => setFiles(curr => [...curr].reverse())}>Reverse</button></>;
    }
    render(<Files />);
    const initialInputs = screen.getAllByRole("textbox");
    fireEvent.click(screen.getAllByRole("button", { name: "Remove" })[0]);
    expect(screen.getAllByRole("textbox")[0]).toBe(initialInputs[1]);
    fireEvent.click(screen.getByRole("button", { name: "Reverse" }));
    expect(screen.getAllByRole("textbox")).toEqual([initialInputs[2], initialInputs[1]]);
  });

  it("appends new selected files and allows selecting the same filename again", () => {
    const first = new File(["first"], "same.pdf");
    const added = new File(["second"], "same.pdf");
    const setFiles = vi.fn();
    const { container } = render(<FileInput files={[first]} setFiles={setFiles} images />);
    const picker = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(picker.accept).toBe("image/*");
    fireEvent.change(picker, { target: { files: [added] } });
    expect(setFiles).toHaveBeenCalledWith([first, added]);
    expect(picker.value).toBe("");
  });

  it("uses breadcrumb navigation in preference to back and calls the back handler otherwise", () => {
    const onBack = vi.fn();
    const { rerender } = render(<DetailPageLayout title="Detail" onBack={onBack} breadcrumbItems={[{ label: "Current", href: "/current" }]}><p>Body</p></DetailPageLayout>);
    expect(screen.getByRole("navigation").textContent).toBe("Current");
    expect(screen.queryByRole("button")).toBeNull();
    rerender(<DetailPageLayout title="Detail" onBack={onBack} backLabel="Back"><p>Body</p></DetailPageLayout>);
    fireEvent.click(screen.getByRole("button", { name: /Back/ }));
    expect(onBack).toHaveBeenCalledOnce();
    rerender(<DetailPageLayout title="Detail"><p>Body</p></DetailPageLayout>);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByRole("heading", { name: "Detail" })).toBeTruthy();
  });

  it("gives a custom card image precedence and prevents action clicks from opening the card", () => {
    const onClick = vi.fn();
    const buttonOnClick = vi.fn();
    const { rerender } = render(<GenericCard title="Card" imageUrl="/fallback.jpg" customImageElement={<span>Custom image</span>} buttonLabel="Action" onClick={onClick} buttonOnClick={buttonOnClick} />);
    expect(screen.getByText("Custom image")).toBeTruthy();
    expect(screen.queryByRole("img")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Action" }));
    expect(buttonOnClick).toHaveBeenCalledOnce();
    expect(onClick).not.toHaveBeenCalled();
    rerender(<GenericCard title="Card" />);
    expect(screen.queryByText("Custom image")).toBeNull();
    expect(screen.queryByRole("img")).toBeNull();
  });
});
