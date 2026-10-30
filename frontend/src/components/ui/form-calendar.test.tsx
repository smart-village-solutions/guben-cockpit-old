import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { Calendar } from "./calendar";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "./form";
import { Input } from "./input";

function RequiredNameForm() {
  const form = useForm({ defaultValues: { name: "" } });
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(() => undefined)}>
        <FormField control={form.control} name="name" rules={{ required: "Enter a name" }} render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl><Input {...field} /></FormControl>
            <FormDescription>Your public name</FormDescription>
            <FormMessage />
          </FormItem>
        )} />
        <button type="submit">Save</button>
      </form>
    </Form>
  );
}

describe("Form and calendar controls", () => {
  it("associates labels and descriptions with the input and announces validation errors", async () => {
    render(<RequiredNameForm />);
    const input = screen.getByRole("textbox", { name: "Name" });
    const description = screen.getByText("Your public name");
    expect(input.getAttribute("aria-describedby")).toBe(description.id);
    expect(input.getAttribute("aria-invalid")).toBe("false");
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    const error = await screen.findByText("Enter a name");
    expect(input.getAttribute("aria-describedby")).toBe(`${description.id} ${error.id}`);
    expect(input.getAttribute("aria-invalid")).toBe("true");
    fireEvent.change(input, { target: { value: "Anna" } });
    await waitFor(() => expect(screen.queryByText("Enter a name")).toBeNull());
    expect(input.getAttribute("aria-invalid")).toBe("false");
  });

  it("selects dates and navigates to the next and previous months", () => {
    const onSelect = vi.fn();
    const onMonthChange = vi.fn();
    render(<Calendar mode="single" defaultMonth={new Date(2026, 9, 1)} onSelect={onSelect} onMonthChange={onMonthChange} />);
    fireEvent.click(screen.getByText("15"));
    expect(onSelect.mock.calls[0][0].getDate()).toBe(15);
    expect(onSelect.mock.calls[0][0].getMonth()).toBe(9);
    fireEvent.click(screen.getByRole("button", { name: /next month/i }));
    expect(onMonthChange.mock.calls[0][0].getMonth()).toBe(10);
    fireEvent.click(screen.getByRole("button", { name: /previous month/i }));
    expect(onMonthChange.mock.calls[1][0].getMonth()).toBe(9);
  });
});
