import { useNavigate } from "@tanstack/react-router";
import sanitizeHtml from "sanitize-html";

import { DetailPageLayout } from "@/components/ui/DetailPageLayout";
import { DetailMediaSection } from "@/components/ui/detailMediaSection";
import { Skeleton } from "@/components/ui/skeleton";
import { useGatewayProjectDetailContent } from "@/public-content/hooks";
import { isGatewayPublicContentEnabled } from "@/public-content/source";
import { useRouteMetadata } from "@/public-content/useRouteMetadata";
import { isNullOrUndefinedOrWhiteSpace } from "@/utilities/nullabilityUtils";

import { PublicContentDisabledState } from "./PublicContentDisabledState";
import { PublicContentErrorState } from "./PublicContentErrorState";

const safeHtml = (value: string) => ({ __html: sanitizeHtml(value) });

export const GatewayProjectDetailPage = ({ projectId }: { projectId: string }) => {
  const navigate = useNavigate();
  const query = useGatewayProjectDetailContent(projectId);
  useRouteMetadata(query.data?.seo);

  if (!isGatewayPublicContentEnabled) return <PublicContentDisabledState />;
  if (query.isPending && !query.data) return <div className="max-w-7xl mx-auto px-4"><Skeleton className="h-96 w-full rounded-lg" /></div>;
  if (query.error || !query.data) return <PublicContentErrorState error={query.error} onRetry={() => void query.refetch()} />;

  if (query.data.kind === "featured") {
    const project = query.data.project;
    const hasDescription = !isNullOrUndefinedOrWhiteSpace(project.description);
    const hasFullText = !isNullOrUndefinedOrWhiteSpace(project.fullText);
    const images = project.imageUrl ? [{ src: project.imageUrl, alt: project.title }] : [];
    return (
      <DetailPageLayout
        heroAlt={project.title}
        title={project.title}
        breadcrumbItems={[
          { label: "Startseite", href: "/" },
          { label: "Mein Guben", href: "/projects" },
          { label: project.title, href: `/projects/${projectId}` },
        ]}
        onBack={() => navigate({ to: "/projects", search: { categoryIds: [], sort: "name", direction: "asc", page: 1, pageSize: 12 } })}
        backLabel="Zurück zu Projekten"
      >
        <div className="space-y-8">
          {hasDescription && (
            <DetailMediaSection
              heading="Übersicht"
              body={<div className="prose max-w-none text-gray-700" dangerouslySetInnerHTML={safeHtml(project.description)} />}
              images={images}
            />
          )}
          {hasFullText && !hasDescription && images.length > 0 ? (
            <DetailMediaSection
              heading="Projektdetails"
              body={<div className="prose max-w-none text-neutral-700" dangerouslySetInnerHTML={safeHtml(project.fullText)} />}
              images={images}
            />
          ) : hasFullText && (
            <section>
              <h2 className="font-bold text-xl mb-4">Projektdetails</h2>
              <div className="prose max-w-none text-neutral-700" dangerouslySetInnerHTML={safeHtml(project.fullText)} />
            </section>
          )}
          {!hasDescription && !hasFullText && images.length > 0 && <DetailMediaSection heading={null} body={null} images={images} />}
        </div>
      </DetailPageLayout>
    );
  }

  const poi = query.data.poi;
  const images = poi.media.map((media) => ({ src: media.url, alt: media.description ?? poi.title }));
  const address = poi.address
    ? [[poi.address.street, poi.address.addition].filter(Boolean).join(" "), [poi.address.zip, poi.address.city].filter(Boolean).join(" ")].filter(Boolean)
    : [];
  const contactName = poi.contact ? [poi.contact.firstName, poi.contact.lastName].filter(Boolean).join(" ") : "";

  return (
    <DetailPageLayout
      heroAlt={poi.title}
      title={poi.title}
      breadcrumbItems={[
        { label: "Startseite", href: "/" },
        { label: "Mein Guben", href: "/projects" },
        { label: poi.title, href: `/projects/${projectId}` },
      ]}
      onBack={() => navigate({ to: "/projects", search: { categoryIds: [], sort: "name", direction: "asc", page: 1, pageSize: 12 } })}
      backLabel="Zurück zur Übersicht"
    >
      <div className="space-y-8">
        {(poi.description || images.length > 0) && (
          <DetailMediaSection
            heading={poi.description ? "Übersicht" : null}
            body={poi.description ? <div className="prose max-w-none text-gray-700" dangerouslySetInnerHTML={safeHtml(poi.description)} /> : null}
            images={images}
          />
        )}

        {address.length > 0 && (
          <section>
            <h2 className="font-bold text-xl mb-3">Anschrift</h2>
            <address className="not-italic text-gray-700">{address.map((line) => <div key={line}>{line}</div>)}</address>
          </section>
        )}

        {(poi.contact || poi.webUrls.length > 0) && (
          <section>
            <h2 className="font-bold text-xl mb-3">Kontakt</h2>
            <div className="space-y-2 text-gray-700">
              {contactName && <p>{contactName}</p>}
              {poi.contact?.phone && <p><a href={`tel:${poi.contact.phone}`}>{poi.contact.phone}</a></p>}
              {poi.contact?.email && <p><a href={`mailto:${poi.contact.email}`}>{poi.contact.email}</a></p>}
              {poi.contact?.fax && <p>Fax: {poi.contact.fax}</p>}
              {poi.webUrls.map((entry) => <p key={entry.url}><a href={entry.url} target="_blank" rel="noreferrer">{entry.description ?? entry.url}</a></p>)}
            </div>
          </section>
        )}

        {poi.openingHours.length > 0 && (
          <section>
            <h2 className="font-bold text-xl mb-3">Öffnungszeiten</h2>
            <dl className="grid gap-2 sm:grid-cols-[auto_1fr]">
              {poi.openingHours.map((entry, index) => (
                <div className="contents" key={`${entry.weekday ?? "day"}-${index}`}>
                  <dt className="font-medium">{entry.weekday ?? "Zeitraum"}</dt>
                  <dd>{entry.description ?? (entry.open === false ? "Geschlossen" : [entry.timeFrom, entry.timeTo].filter(Boolean).join(" – "))}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {poi.categories.length > 0 && (
          <section>
            <h2 className="font-bold text-xl mb-3">Kategorien</h2>
            <div className="flex flex-wrap gap-2">{poi.categories.map((category) => <span key={category.id} className="rounded-full border px-3 py-1 text-sm">{category.name}</span>)}</div>
          </section>
        )}

        {(poi.operatingCompany || poi.dataProvider) && (
          <section className="text-sm text-gray-600">
            {poi.operatingCompany && <p>Betreiber: {poi.operatingCompany}</p>}
            {poi.dataProvider && <p>Datenquelle: {poi.dataProvider}</p>}
          </section>
        )}
      </div>
    </DetailPageLayout>
  );
};
