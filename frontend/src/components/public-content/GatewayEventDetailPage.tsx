import { ClockIcon, MapPinIcon } from "lucide-react";
import { useMemo, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useRouter } from "@tanstack/react-router";

import PriceCard from "@/components/booking/priceCard";
import { MapComponent } from "@/components/home/MapComponent";
import { DetailPageLayout } from "@/components/ui/DetailPageLayout";
import { useGatewayEventDetailContent } from "@/public-content/hooks";
import { isGatewayPublicContentEnabled } from "@/public-content/source";
import { useRouteMetadata } from "@/public-content/useRouteMetadata";
import { useEventStore } from "@/stores/eventStore";
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

  if (!isGatewayPublicContentEnabled) {
    return <PublicContentDisabledState />;
  }

  const tickets = (data as any)?.isBookingEvent
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
          {startDate && <span>{startDate.formatDateTime()}</span>}
          {startDate && endDate && "-"}
          {endDate && (
            <span>
              {startDate && startDate.formatDate() === endDate.formatDate()
                ? endDate.formatTime()
                : endDate.formatDateTime()}
            </span>
          )}
        </p>
      </div>

      {/* Location */}
      <div className="space-y-1">
        <p className="flex flex-nowrap items-center gap-2 text-neutral-500">
          <MapPinIcon className="size-4" /> {t("Location")}
        </p>
        <p className="flex gap-1">{`${data.location.street}, ${data.location.zip} ${data.location.city} (${data.location.name})`}</p>
      </div>
    </div>
  );

  return (
    <DetailPageLayout
      heroImage={data.images.length > 0 ? data.images[0].originalUrl : "/images/stadt-guben.jpg"}
      heroAlt={data.title}
      title={(data as any)?.isBookingEvent ? <TranslatedText text={data.title} /> : data.title}
      metadata={metadata}
      breadcrumbItems={[
        { label: 'Startseite', href: '/' },
        { label: 'Veranstaltungen', href: '/events' },
        { label: data.title, href: `/events/${eventId}` }
      ]}
    >
      <div className="space-y-8">
        {/* Description */}
        <div className="w-full lg:w-1/2 space-y-2">
          <h2 className="font-bold">{t("EventDetails")}</h2>
          {(data as any)?.isBookingEvent ? (
            <TranslatedHtml text={data.description} />
          ) : (
            <p className="text-neutral-600">{data.description}</p>
          )}
        </div>

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
        <div className="flex min-h-[70vh] h-full">
          <MapComponent
            src={import.meta.env.VITE_MASTERPORTAL_URL}
            lat={data.coordinates?.latitude}
            lon={data.coordinates?.longitude}
          />
        </div>
      </div>
    </DetailPageLayout>
  );
};
