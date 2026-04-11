import { createRoot, hydrateRoot } from 'react-dom/client'

import { createRouter, RouterProvider } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {FetchInterceptor} from "./utilities/fetchApiExtensions";
import { useEffect } from 'react'

import "./utilities"
import "./index.css"
import "./utilities/i18n/initializeTranslations.ts";
import "./utilities/dateExtensions";

// Type declaration for Matomo Tag Manager
declare global {
  interface Window {
    _mtm: any[];
  }
}


FetchInterceptor.register();

const queryClient = new QueryClient();

// Set  up a Router instance
const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
})

// Register things for typesafety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('app')!

if (rootElement.hasChildNodes()) {
  hydrateRoot(rootElement, <App />)
} else {
  const root = createRoot(rootElement)
  root.render(<App />)
}

export function App() {
  useEffect(() => {
    // Only load Matomo in production (not on localhost)
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (!isLocalhost && import.meta.env.VITE_MATOMO_JS) {
      var _mtm = window._mtm = window._mtm || [];
      _mtm.push({
        'mtm.startTime': (new Date().getTime()),
        'event': 'mtm.Start'
      });

      var d = document, g = d.createElement('script'), s = d.getElementsByTagName('script')[0];
      g.async = true;
      g.src = import.meta.env.VITE_MATOMO_JS;

      if (s.parentNode) {
        s.parentNode.insertBefore(g, s);
      }
    }
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
