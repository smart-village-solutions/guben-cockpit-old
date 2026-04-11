import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const createRootRender = vi.hoisted(() => vi.fn());
const createRootMock = vi.hoisted(() =>
  vi.fn(() => ({
    render: createRootRender,
  })),
);
const hydrateRootMock = vi.hoisted(() => vi.fn());
const createRouterMock = vi.hoisted(() => vi.fn(() => "router-instance"));
const registerFetchInterceptor = vi.hoisted(() => vi.fn());
const queryClientCtor = vi.hoisted(() => vi.fn(() => ({ queryClient: true })));

vi.mock("react-dom/client", () => ({
  createRoot: createRootMock,
  hydrateRoot: hydrateRootMock,
}));

vi.mock("@tanstack/react-router", () => ({
  createRouter: createRouterMock,
  RouterProvider: ({ router }: { router: string }) => <div>RouterProvider {router}</div>,
}));

vi.mock("@tanstack/react-query", () => ({
  QueryClient: queryClientCtor,
  QueryClientProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("./routeTree.gen", () => ({
  routeTree: "route-tree",
}));

vi.mock("./utilities/fetchApiExtensions", () => ({
  FetchInterceptor: {
    register: registerFetchInterceptor,
  },
}));

vi.mock("./utilities", () => ({}));
vi.mock("./index.css", () => ({}));
vi.mock("./utilities/i18n/initializeTranslations.ts", () => ({}));
vi.mock("./utilities/dateExtensions", () => ({}));

describe("main bootstrap", () => {
  function setLocation(url: string) {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: new URL(url),
    });
  }

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    document.body.innerHTML = "";
    window._mtm = [];
    setLocation("https://guben.de/");
  });

  it("creates the router, registers fetch interception and mounts with createRoot", async () => {
    document.body.innerHTML = '<div id="app"></div>';

    await import("./main");

    expect(registerFetchInterceptor).toHaveBeenCalledTimes(1);
    expect(queryClientCtor).toHaveBeenCalledTimes(1);
    expect(createRouterMock).toHaveBeenCalledWith({
      routeTree: "route-tree",
      defaultPreload: "intent",
    });
    expect(createRootMock).toHaveBeenCalledWith(document.getElementById("app"));
    expect(createRootRender).toHaveBeenCalledTimes(1);
    expect(hydrateRootMock).not.toHaveBeenCalled();
  });

  it("hydrates an existing root instead of creating a new one", async () => {
    document.body.innerHTML = '<div id="app"><div>server</div></div>';

    await import("./main");

    expect(hydrateRootMock).toHaveBeenCalledTimes(1);
    expect(createRootMock).not.toHaveBeenCalled();
  });

  it("renders the app and injects Matomo only outside localhost when configured", async () => {
    vi.stubEnv("VITE_MATOMO_JS", "https://analytics.example.test/matomo.js");
    document.body.innerHTML = '<div id="app"></div><script id="existing-script"></script>';

    const module = await import("./main");
    render(<module.App />);

    expect(screen.getByText("RouterProvider router-instance")).toBeTruthy();

    await waitFor(() => {
      const injectedScript = document.querySelector('script[src="https://analytics.example.test/matomo.js"]');
      expect(injectedScript).toBeTruthy();
    });

    expect(window._mtm[0]?.event).toBe("mtm.Start");
  });

  it("does not inject Matomo on localhost", async () => {
    vi.stubEnv("VITE_MATOMO_JS", "https://analytics.example.test/matomo.js");
    setLocation("http://localhost:3000/");
    document.body.innerHTML = '<div id="app"></div><script id="existing-script"></script>';

    const module = await import("./main");
    render(<module.App />);

    await waitFor(() => {
      expect(screen.getByText("RouterProvider router-instance")).toBeTruthy();
    });

    expect(document.querySelector('script[src="https://analytics.example.test/matomo.js"]')).toBeNull();
    expect(window._mtm).toEqual([]);
  });
});
