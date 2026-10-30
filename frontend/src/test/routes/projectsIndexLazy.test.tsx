import type { ComponentType } from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import en from "@/assets/locales/en/navigation.json";
import pl from "@/assets/locales/pl/navigation.json";

const state = vi.hoisted(() => ({ language: "en", navigate: vi.fn() }));
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => ((state.language === "pl" ? pl : en) as Record<string, string>)[key] ?? key }) }));
vi.mock("@tanstack/react-router", () => ({ createLazyFileRoute: () => (options: unknown) => ({ options, useSearch: () => ({ page: 1, pageSize: 12 }), useNavigate: () => state.navigate }) }));
vi.mock("@/components/ui/Breadcrumb", () => ({ Breadcrumb: ({ items }: { items: Array<{ label: string; href: string }> }) => <nav>{items.map((item) => <a key={item.href} href={item.href}>{item.label}</a>)}</nav> }));
vi.mock("@/components/public-content/GatewayProjectsPage", () => ({ GatewayProjectsPage: ({ onSearchChange }: { onSearchChange: (search: { page: number }) => void }) => <button onClick={() => onSearchChange({ page: 2 })}>Next page</button> }));
import { Route } from "@/routes/projects/index.lazy";
const Component = (Route as unknown as { options: { component: ComponentType } }).options.component;
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("project overview route", () => {
  it.each(["en", "pl"])("localizes breadcrumbs for %s and leaves the introduction to gateway content", (language) => {
    state.language = language;
    const dictionary = language === "pl" ? pl : en;
    render(<Component />);
    expect(screen.getByRole("link", { name: dictionary.Home }).getAttribute("href")).toBe("/");
    expect(screen.getByRole("link", { name: dictionary.Projects }).getAttribute("href")).toBe("/projects");
    expect(screen.queryByRole("heading")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    const navigation = state.navigate.mock.calls[0][0];
    expect(navigation.replace).toBe(true);
    expect(navigation.search()).toEqual({ page: 2 });
  });
});
