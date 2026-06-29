export default function BuilderPreviewDisabled() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-16">
      <section className="rounded-3xl bg-white p-8 shadow-xl">
        <h1 className="font-poppins text-3xl font-bold text-gubenAccent">Builder-Vorschau ist im Deploy deaktiviert</h1>
        <p className="mt-4 leading-7 text-slate-600">
          Diese Route ist nur im lokalen Dev-Server aktiv. Fuer Builder.io starte das Frontend lokal mit <code>npm run dev</code>.
        </p>
      </section>
    </main>
  );
}
