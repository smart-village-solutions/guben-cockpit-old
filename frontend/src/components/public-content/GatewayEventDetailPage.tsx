import { ArrowLeftIcon, ClockIcon, MapPinIcon } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useRouter } from "@tanstack/react-router";

import PriceCard from "@/components/booking/priceCard";
import { MapComponent } from "@/components/home/MapComponent";
import { Button } from "@/components/ui/button";
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

  if (!isGatewayPublicContentEnabled) {
    return <PublicContentDisabledState />;
  }

  const [startDate, endDate] = useMemo(
    () =>
      data
        ? [new Date(data.startDate), new Date(data.endDate)]
        : [undefined, undefined],
    [data],
  );

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

  return (
    <main className="relative">
      <Button
        variant="ghost"
        className="z-10 text-white gap-2 absolute top-4 left-4 flex items-center hover:bg-none"
        onClick={() => navigate({ to: "/events" })}
      >
        <ArrowLeftIcon className="size-4" />
        <span>{t("AllEvents")}</span>
      </Button>
      <div className="relative h-[24em]">
        <div className="absolute top-0 left-0 w-full h-full bg-[rgba(0,0,0,0.6)]" />
        <img
          src={data.images.length > 0 ? data.images[0].originalUrl : "/images/stadt-guben.jpg"}
          className="h-full w-full object-cover"
        />
      </div>

      <section className="max-w-4xl mx-auto space-y-8 translate-y-[-96px]">
        <div className="mx-auto p-8 rounded-md bg-white space-y-2 shadow-lg">
          <div className="flex gap-2">
            {data.categories.map((category: EventDetailContent["event"]["categories"][number]) => (
              <p key={category.id} className="px-4 border-neutral-300 border rounded-full">
                {category.name}
              </p>
            ))}
          </div>

          {(data as any)?.isBookingEvent ? (
            <h1 className="font-bold">
              <TranslatedText text={data.title} />
            </h1>
          ) : (
            <h1 className="font-bold">{data.title}</h1>
          )}

          <div className="space-y-1">
            <p className="flex gap-2 flex-nowrap items-center text-neutral-500">
              <ClockIcon className="size-4" /> {t("DateAndTime")}
            </p>
            <p className="flex gap-1 text-neutral-800">
              {startDate && <span>{startDate.formatDateTime()}</span>}
              {startDate && endDate && "-"}
              {endDate && <span>{endDate.formatDateTime()}</span>}
            </p>
          </div>

          <div className="space-y-1">
            <p className="flex flex-nowrap items-center gap-2 text-neutral-500">
              <MapPinIcon className="size-4" /> {t("Location")}
            </p>
            <p className="flex gap-1">{`${data.location.street}, ${data.location.zip} ${data.location.city} (${data.location.name})`}</p>
          </div>
        </div>

        <div>
          <div className="w-full lg:w-1/2 space-y-2">
            <h2 className="font-bold">{t("EventDetails")}</h2>
            {(data as any)?.isBookingEvent ? (
              <TranslatedHtml text={data.description} />
            ) : (
              <p className="text-neutral-600">{data.description}</p>
            )}
          </div>
        </div>

        {tickets.length > 0 &&
          tickets.map((ticket, index) => (
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

        <div className="flex min-h-[70vh] h-full">
          <MapComponent
            src={import.meta.env.VITE_MASTERPORTAL_URL}
            lat={data.coordinates?.latitude}
            lon={data.coordinates?.longitude}
          />
        </div>
      </section>
    </main>
  );
};
