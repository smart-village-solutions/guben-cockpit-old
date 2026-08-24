import { ClockIcon, ExternalLinkIcon, MailIcon, MapPinIcon, PhoneIcon } from "lucide-react";
import { useMemo, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useRouter } from "@tanstack/react-router";
import sanitizeHtml from "sanitize-html";

import PriceCard from "@/components/booking/priceCard";
import { buildDetailImages, containsHtmlMarkup, isBookingEvent } from "@/components/events/eventPresentation";
import { DetailPageLayout } from "@/components/ui/DetailPageLayout";
import { DetailMediaSection } from "@/components/ui/detailMediaSection";
import { useGatewayEventDetailContent } from "@/public-content/hooks";
import { isGatewayPublicContentEnabled } from "@/public-content/source";
import { useRouteMetadata } from "@/public-content/useRouteMetadata";
import { useEventStore } from "@/stores/eventStore";
import { formatEventDateRange } from "@/utilities/eventDateRange";
import { formatEventLocation } from "@/utilities/location";
import { TranslatedHtml, TranslatedText } from "@/utilities/translateUtils";
import type { EventDetailContent } from "@shared/public-content/contracts";

import { PublicContentErrorState } from "./PublicContentErrorState";
import { PublicContentDisabledState } from "./PublicContentDisabledState";

const formatPrice = (amount: number | null | undefined) => {
  if (typeof amount !== "number") {
    return null;
  }

  if (amount === 0) {
    return "Kostenlos";
  }

  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(amount);
};

export const GatewayEventDetailPage = ({ eventId }: { eventId: string }) => {
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const router = useRouter();
  const eventFromState = (router.state.location.state as { event?: any } | undefined)?.event;
  const query = useGatewayEventDetailContent(eventId);
  const data = eventFromState ?? query.data?.event;
  useRouteMetadata(query.data?.seo);
  const [startDate, endDate] = useMemo(
    () =>
      data
        ? [new Date(data.startDate), new Date(data.endDate)]
        : [undefined, undefined],
    [data],
  );
  const detailImages = useMemo(() => (data ? buildDetailImages(data) : []), [data]);
  const hasContact = Boolean(data?.contact?.email || data?.contact?.phone || data?.contact?.website);

  if (!isGatewayPublicContentEnabled) {
    return <PublicContentDisabledState />;
  }

  const tickets = data && isBookingEvent(data)
    ? useEventStore.getState().getTicketsByBkid(eventId)
    : [];

  if (query.isPending && !data) {
    return <div className="p-8">Event wird geladen …</div>;
  }

  if ((query.error || !query.data) && !data) {
    return <PublicContentErrorState error={query.error} onRetry={() => void query.refetch()} />;
  }

  if (!data) {
    return <PublicContentErrorState error={query.error} />;
  }

  // Build metadata card content
  const metadata: ReactNode = (
    <div className="space-y-4">
      {/* Categories */}
      <div className="flex gap-2 flex-wrap">
        {data.categories.map((category: EventDetailContent["event"]["categories"][number]) => (
          <p key={category.id} className="px-4 border-neutral-300 border rounded-full text-sm">
            {category.name}
          </p>
        ))}
      </div>

      {/* Date and Time */}
      <div className="space-y-1">
        <p className="flex gap-2 flex-nowrap items-center text-neutral-500">
          <ClockIcon className="size-4" /> {t("DateAndTime")}
        </p>
        <p className="flex gap-1 text-neutral-800">
          {startDate && endDate && <span>{formatEventDateRange(startDate, endDate)}</span>}
        </p>
      </div>

      {/* Location */}
      <div className="space-y-1">
        <p className="flex flex-nowrap items-center gap-2 text-neutral-500">
          <MapPinIcon className="size-4" /> {t("Location")}
        </p>
        <p className="flex gap-1">{formatEventLocation(data.location)}</p>
      </div>
    </div>
  );

  return (
    <DetailPageLayout
      heroAlt={data.title}
      title={isBookingEvent(data) ? <TranslatedText text={data.title} /> : data.title}
      metadata={metadata}
      breadcrumbItems={[
        { label: 'Startseite', href: '/' },
        { label: 'Veranstaltungen', href: '/events' },
        { label: data.title, href: `/events/${eventId}` }
      ]}
    >
      <div className="space-y-8">
        <DetailMediaSection
          heading={t("EventDetails")}
          body={(
            isBookingEvent(data) ? (
              <TranslatedHtml className="prose max-w-none" text={data.description} />
            ) : containsHtmlMarkup(data.description) ? (
              <div
                className="prose max-w-none text-neutral-600 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(data.description) }}
              />
            ) : (
              <p className="text-neutral-600 leading-relaxed">{data.description}</p>
            )
          )}
          images={detailImages}
        />

        {(typeof data.registrationRequired === "boolean" || data.maximumAttendees || data.organizerName || hasContact || data.urls.length > 0 || (data.priceInformations?.length ?? 0) > 0 || data.dataProviderName) ? (
          <section className="grid gap-6 md:grid-cols-2" aria-label="Weitere Veranstaltungsinformationen">
            {(typeof data.registrationRequired === "boolean" || data.maximumAttendees) ? (
              <div>
                <h2 className="text-lg font-semibold">Teilnahme</h2>
                <div className="mt-2 space-y-1 text-neutral-700">
                  {typeof data.registrationRequired === "boolean" ? (
                    <p>{data.registrationRequired ? "Anmeldung erforderlich" : "Keine Anmeldung erforderlich"}</p>
                  ) : null}
                  {data.maximumAttendees ? <p>Maximale Teilnehmerzahl: {data.maximumAttendees}</p> : null}
                </div>
              </div>
            ) : null}
            {data.organizerName ? (
              <div>
                <h2 className="text-lg font-semibold">Veranstaltet von</h2>
                <p className="text-neutral-700">{data.organizerName}</p>
              </div>
            ) : null}
            {hasContact ? (
              <div>
                <h2 className="text-lg font-semibold">Kontakt</h2>
                <div className="mt-2 flex flex-col items-start gap-2">
                  {data.contact?.email ? <a className="inline-flex items-center gap-2 underline" href={`mailto:${data.contact.email}`}><MailIcon className="size-4" />{data.contact.email}</a> : null}
                  {data.contact?.phone ? <a className="inline-flex items-center gap-2 underline" href={`tel:${data.contact.phone}`}><PhoneIcon className="size-4" />{data.contact.phone}</a> : null}
                  {data.contact?.website ? <a className="inline-flex items-center gap-2 underline" href={data.contact.website} target="_blank" rel="noreferrer"><ExternalLinkIcon className="size-4" />Website</a> : null}
                </div>
              </div>
            ) : null}
            {data.priceInformations && data.priceInformations.length > 0 ? (
              <div>
                <h2 className="text-lg font-semibold">Preise</h2>
                <ul className="mt-2 space-y-1 text-neutral-700">
                  {data.priceInformations.map((price: NonNullable<EventDetailContent["event"]["priceInformations"]>[number], index: number) => (
                    <li key={`${price.name ?? "price"}-${index}`}>
                      {[price.name, formatPrice(price.amount), price.description].filter(Boolean).join(" · ")}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {data.urls.length > 0 ? (
              <div>
                <h2 className="text-lg font-semibold">Weiterführende Links</h2>
                <ul className="mt-2 space-y-2">
                  {data.urls.map((url: EventDetailContent["event"]["urls"][number]) => <li key={url.link}><a className="inline-flex items-center gap-2 underline" href={url.link} target="_blank" rel="noreferrer"><ExternalLinkIcon className="size-4" />{url.description || url.link}</a></li>)}
                </ul>
              </div>
            ) : null}
            {data.dataProviderName ? <p className="text-sm text-neutral-500 md:col-span-2">Quelle: {data.dataProviderName}</p> : null}
          </section>
        ) : null}

        {/* Price Cards */}
        {tickets.length > 0 && (
          <div className="space-y-4">
            {tickets.map((ticket, index) => (
              <PriceCard
                key={index}
                bookingUrl={ticket.bookingUrl}
                prices={ticket.prices}
                title={ticket.title}
                flags={ticket.flags}
                location={ticket.location}
                autoCommitNote={ticket.autoCommitNote}
              />
            ))}
          </div>
        )}
      </div>
    </DetailPageLayout>
  );
};
