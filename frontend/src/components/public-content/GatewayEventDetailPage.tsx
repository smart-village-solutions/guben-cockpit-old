import { ClockIcon, MapPinIcon } from "lucide-react";
import { useMemo, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useRouter } from "@tanstack/react-router";
import sanitizeHtml from "sanitize-html";

import PriceCard from "@/components/booking/priceCard";
import { buildDetailImages, containsHtmlMarkup, isBookingEvent } from "@/components/events/eventPresentation";
import { MapComponent } from "@/components/home/MapComponent";
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

        {/* Map */}
        {data.coordinates ? (
          <div className="flex min-h-[70vh] h-full">
            <MapComponent
              src={import.meta.env.VITE_MASTERPORTAL_URL}
              lat={data.coordinates.latitude}
              lon={data.coordinates.longitude}
            />
          </div>
        ) : null}
      </div>
    </DetailPageLayout>
  );
};
