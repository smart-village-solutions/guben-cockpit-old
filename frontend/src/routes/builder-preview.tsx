import { createFileRoute } from "@tanstack/react-router";
import { Suspense, lazy } from "react";

const BuilderPreviewContent = lazy(() => import("@/builder/BuilderPreviewEntry"));

export const Route = createFileRoute("/builder-preview")({
  component: BuilderPreviewRoute,
});

function BuilderPreviewRoute() {
  return (
    <Suspense
      fallback={
        <BuilderPreviewState
          title="Builder-Vorschau wird geladen"
          body="Die Builder-spezifischen Komponenten werden nur fuer diese Route nachgeladen."
        />
      }
    >
      <BuilderPreviewContent />
    </Suspense>
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
          Beispiel lokal: <code>http://localhost:3000/builder-preview?url=/</code>
        </p>
      </section>
    </main>
  );
}
