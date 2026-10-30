import { withContentKeys } from "@/utilities/contentKeys";
import { ClockIcon, ExternalLinkIcon, MailIcon, MapPinIcon, PhoneIcon } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "@tanstack/react-router";
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
  const router = useRouter();
  const eventFromState = (router.state.location.state as { event?: EventDetailContent["event"] } | undefined)?.event;
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


  return (
    <DetailPageLayout
      heroAlt={data.title}
      title={isBookingEvent(data) ? <TranslatedText text={data.title} /> : data.title}
      metadata={<EventMetadata data={data} startDate={startDate} endDate={endDate} />}
      breadcrumbItems={[
        { label: 'Startseite', href: '/' },
        { label: 'Veranstaltungen', href: '/events' },
        { label: data.title, href: `/events/${eventId}` }
      ]}
    >
      <div className="space-y-8">
        <DetailMediaSection
          heading={t("EventDetails")}
          body={<EventDescription data={data} />}
          images={detailImages}
        />

        <EventAdditionalInformation data={data} />

        {/* Price Cards */}
        {tickets.length > 0 && (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <PriceCard
                key={ticket.bkid || ticket.bookingUrl}
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

type DetailEvent = EventDetailContent["event"];

const EventDescription = ({ data }: { data: DetailEvent }) => {
  if (isBookingEvent(data)) return <TranslatedHtml className="prose max-w-none" text={data.description} />;
  if (containsHtmlMarkup(data.description)) return <div className="prose max-w-none text-neutral-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: sanitizeHtml(data.description) }} />;
  return <p className="text-neutral-600 leading-relaxed">{data.description}</p>;
};

const EventMetadata = ({ data, startDate, endDate }: { data: DetailEvent; startDate?: Date; endDate?: Date }) => {
  const { t } = useTranslation("common");
  const locationLabel = formatEventLocation(data.location);
  return (
    <div className="space-y-4">
      {/* Categories */}
      {data.categories.length > 0 ? (
        <div className="flex gap-2 flex-wrap">
          {data.categories.map((category: EventDetailContent["event"]["categories"][number]) => (
            <p key={category.id} className="px-4 border-neutral-300 border rounded-full text-sm">
              {category.name}
            </p>
          ))}
        </div>
      ) : null}

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
      {locationLabel ? (
        <div className="space-y-1">
          <p className="flex flex-nowrap items-center gap-2 text-neutral-500">
            <MapPinIcon className="size-4" /> {t("Location")}
          </p>
          <p className="flex gap-1">{locationLabel}</p>
        </div>
      ) : null}
    </div>
  );
};

const EventAdditionalInformation = ({ data }: { data: DetailEvent }) => {
  const hasContact = Boolean(data.contact?.email || data.contact?.phone || data.contact?.website);
  const hasParticipation = typeof data.registrationRequired === "boolean" || Boolean(data.maximumAttendees);
  const hasPrices = Boolean(data.priceInformations?.length);
  const hasInformation = hasParticipation || data.organizerName || hasContact || data.urls.length > 0 || hasPrices || data.dataProviderName;
  if (!hasInformation) return null;
  return (
    <section className="grid gap-6 md:grid-cols-2" aria-label="Weitere Veranstaltungsinformationen">
      <EventParticipation data={data} />
      {data.organizerName ? (
        <div>
          <h2 className="text-lg font-semibold">Veranstaltet von</h2>
          <p className="text-neutral-700">{data.organizerName}</p>
        </div>
      ) : null}
      <EventContact data={data} />
      {data.priceInformations && data.priceInformations.length > 0 ? (
        <div>
          <h2 className="text-lg font-semibold">Preise</h2>
          <ul className="mt-2 space-y-1 text-neutral-700">
            {withContentKeys(data.priceInformations, (price) => JSON.stringify([price.name, price.amount, price.description])).map(({ item: price, key }) => (
              <li key={key}>
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
  );
};

const EventParticipation = ({ data }: { data: DetailEvent }) => {
  if (typeof data.registrationRequired !== "boolean" && !data.maximumAttendees) return null;
  return (
    <div>
      <h2 className="text-lg font-semibold">Teilnahme</h2>
      <div className="mt-2 space-y-1 text-neutral-700">
        {typeof data.registrationRequired === "boolean" ? (
          <p>{data.registrationRequired ? "Anmeldung erforderlich" : "Keine Anmeldung erforderlich"}</p>
        ) : null}
        {data.maximumAttendees ? <p>Maximale Teilnehmerzahl: {data.maximumAttendees}</p> : null}
      </div>
    </div>
  );
};

const EventContact = ({ data }: { data: DetailEvent }) => {
  if (!data.contact?.email && !data.contact?.phone && !data.contact?.website) return null;
  return (
    <div>
      <h2 className="text-lg font-semibold">Kontakt</h2>
      <div className="mt-2 flex flex-col items-start gap-2">
        {data.contact?.email ? <a className="inline-flex items-center gap-2 underline" href={`mailto:${data.contact.email}`}><MailIcon className="size-4" />{data.contact.email}</a> : null}
        {data.contact?.phone ? <a className="inline-flex items-center gap-2 underline" href={`tel:${data.contact.phone}`}><PhoneIcon className="size-4" />{data.contact.phone}</a> : null}
        {data.contact?.website ? <a className="inline-flex items-center gap-2 underline" href={data.contact.website} target="_blank" rel="noreferrer"><ExternalLinkIcon className="size-4" />Website</a> : null}
      </div>
    </div>
  );
};
