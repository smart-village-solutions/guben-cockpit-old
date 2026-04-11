import { BuilderComponent, builder, useIsPreviewing } from "@builder.io/react";
import { useEffect, useMemo, useState } from "react";

import { builderModel, builderPreviewUrl, builderPublicApiKey } from "@/builder/config";

import "./registry";

const localBuilderPreviewExamplePath = "/builder-preview?url=/";

export default function BuilderPreviewContent() {
  const isPreviewingInBuilder = useIsPreviewing();
  const [content, setContent] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const targetUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return builderPreviewUrl;
    }

    const url = new URL(window.location.href);
    return url.searchParams.get("url") || builderPreviewUrl;
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadContent() {
      if (!builderPublicApiKey) {
        setError("VITE_BUILDER_PUBLIC_API_KEY fehlt.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const entry = await builder
          .get(builderModel, {
            userAttributes: {
              urlPath: targetUrl,
            },
          })
          .promise();

        if (!isActive) {
          return;
        }

        setContent(entry ?? null);

        if (entry?.data?.title) {
          document.title = entry.data.title;
        }
      } catch (cause) {
        if (!isActive) {
          return;
        }

        const message = cause instanceof Error ? cause.message : "Builder-Inhalt konnte nicht geladen werden.";
        setError(message);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadContent();

    return () => {
      isActive = false;
    };
  }, [targetUrl]);

  if (!builderPublicApiKey) {
    return (
      <BuilderPreviewState
        title="Builder.io ist noch nicht konfiguriert"
        body="Trage deinen Public API Key in frontend/.env als VITE_BUILDER_PUBLIC_API_KEY ein und starte den Dev-Server neu."
      />
    );
  }

  if (isLoading) {
    return <BuilderPreviewState title="Builder-Inhalt wird geladen" body={`Suche Modell "${builderModel}" fuer URL "${targetUrl}".`} />;
  }

  if (error) {
    return <BuilderPreviewState title="Builder-Inhalt konnte nicht geladen werden" body={error} />;
  }

  if (!content && !isPreviewingInBuilder) {
    return (
      <BuilderPreviewState
        title="Kein Builder-Inhalt gefunden"
        body={`Es gibt noch keinen Eintrag im Modell "${builderModel}" fuer die URL "${targetUrl}".`}
      />
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-6 px-6 py-8 md:px-12">
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-sm">
        Preview-URL: <span className="font-semibold text-slate-900">{targetUrl}</span>
      </div>
      <BuilderComponent model={builderModel} content={content || undefined} />
    </main>
  );
}

type BuilderPreviewStateProps = {
  title: string;
  body: string;
};

function BuilderPreviewState({ title, body }: BuilderPreviewStateProps) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-16">
      <section className="rounded-3xl bg-white p-8 shadow-xl">
        <h1 className="font-poppins text-3xl font-bold text-gubenAccent">{title}</h1>
        <p className="mt-4 leading-7 text-slate-600">{body}</p>
        <p className="mt-6 text-sm text-slate-500">
          Beispiel lokal: <code>{localBuilderPreviewExamplePath}</code>
        </p>
      </section>
    </main>
  );
}
