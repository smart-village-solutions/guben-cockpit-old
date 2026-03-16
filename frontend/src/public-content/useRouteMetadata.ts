import { useEffect } from "react";

import type { SeoMetadata } from "@shared/public-content/contracts";

const setMetaTag = (name: string, content: string, attribute: "name" | "property" = "name") => {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
};

export const useRouteMetadata = (metadata?: SeoMetadata) => {
  useEffect(() => {
    if (!metadata) {
      return;
    }

    document.title = metadata.title;
    setMetaTag("description", metadata.description);
    setMetaTag("robots", metadata.indexable ? "index,follow" : "noindex,nofollow");
    setMetaTag("og:title", metadata.title, "property");
    setMetaTag("og:description", metadata.description, "property");

    let canonicalLink = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.rel = "canonical";
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = metadata.canonical;
  }, [metadata]);
};
