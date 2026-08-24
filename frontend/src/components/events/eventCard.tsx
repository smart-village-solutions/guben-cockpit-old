import { BaseImgTag } from "@/components/ui/BaseImgTag";
import { GenericCard } from "@/components/ui/GenericCard";
import type { Event } from "@shared/public-content/contracts";
import { CaretLeftIcon, CaretRightIcon } from "@radix-ui/react-icons";
import { Link } from "@tanstack/react-router";
import { ClockIcon, MapPinIcon } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import sanitizeHtml from "sanitize-html";
import { formatEventDateRange } from "@/utilities/eventDateRange";
import { formatEventLocation } from "@/utilities/location";
import { TranslatedHtml, TranslatedText } from "@/utilities/translateUtils";
import { getEventImage } from "@/lib/DefaultEventImage";

import { containsHtmlMarkup, isBookingEvent } from "./eventPresentation";

interface EventCardProps {
  event: Event;
}

type EventImageCarouselProps = {
  event: Event;
  selectedImage: number;
  onSelectImage: (nextIndex: number) => void;
};

const EventImageCarousel = ({ event, selectedImage, onSelectImage }: EventImageCarouselProps) => {
  if (event.images.length > 0 && event.images[selectedImage]) {
    return (
      <div className="text-white relative flex h-full w-full items-center justify-center overflow-hidden bg-[#808080] group">
        {selectedImage > 0 && event.images.length > 1 && (
          <button
            onClick={() => onSelectImage(selectedImage - 1)}
            className="absolute left-0 top-0 z-10 opacity-0 flex items-center h-full px-2 bg-black bg-opacity-25 hover:cursor-pointer group-hover:opacity-100 transition-opacity"
            aria-label="Previous image"
          >
            <CaretLeftIcon className="size-8" />
          </button>
        )}

        <BaseImgTag
          className="w-full h-full object-contain"
          src={event.images[selectedImage].previewUrl}
          alt="Event"
        />

        {selectedImage < event.images.length - 1 && event.images.length > 1 && (
          <button
            onClick={() => onSelectImage(selectedImage + 1)}
            className="absolute right-0 top-0 z-10 opacity-0 flex items-center h-full px-2 bg-black bg-opacity-25 hover:cursor-pointer group-hover:opacity-100 transition-opacity"
            aria-label="Next image"
          >
            <CaretRightIcon className="size-8" />
          </button>
        )}
      </div>
    );
  }

  const firstCategoryName = event.categories?.[0]?.name ?? null;
  const image = getEventImage(firstCategoryName);

  return image ? (
    <div className="flex h-full w-full items-center justify-center bg-[#808080]">
      <BaseImgTag
        className="w-full h-full object-contain"
        src={image}
        alt={firstCategoryName || "Event category"}
      />
    </div>
  ) : null;
};

function EventCard({ event }: EventCardProps) {
  const bookingEvent = isBookingEvent(event);
  const [selectedImage, setSelectedImage] = useState(0);
  const { t } = useTranslation("common");

  const categoryTags = event.categories.map((c) => ({
    id: c.id,
    name: c.name,
  }));

  const description = bookingEvent ? (
    <TranslatedHtml
      className="text-sm text-gray-600 line-clamp-3"
      text={event.description}
    />
  ) : containsHtmlMarkup(event.description) ? (
    sanitizeHtml(event.description)
  ) : (
    <p className="text-sm text-gray-600 line-clamp-3">{event.description}</p>
  );

  const [startDate, endDate] = useMemo(
    () => [new Date(event.startDate), new Date(event.endDate)],
    [event]
  );
  const firstPrice = event.priceInformations?.[0];
  const priceLabel = firstPrice
    ? [
        firstPrice.name,
        firstPrice.amount === 0
          ? "Kostenlos"
          : typeof firstPrice.amount === "number"
            ? `${new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(firstPrice.amount)}`
            : null,
      ].filter(Boolean).join(" · ")
    : null;

  const extraInfo: ReactNode = (
    <div className="space-y-2 flex flex-col">
      <div className="flex items-start gap-2 text-sm">
        <MapPinIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p className="line-clamp-2">{formatEventLocation(event.location)}</p>
      </div>
      <div className="flex items-start gap-2 text-sm">
        <ClockIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p className="line-clamp-2">{formatEventDateRange(startDate, endDate)}</p>
      </div>
      {event.organizerName ? (
        <p className="text-sm text-neutral-600">Veranstaltet von {event.organizerName}</p>
      ) : null}
      {priceLabel ? <p className="text-sm font-medium text-neutral-700">{priceLabel}</p> : null}
    </div>
  );

  const card = (
    <GenericCard
      customImageElement={
        <EventImageCarousel
          event={event}
          selectedImage={selectedImage}
          onSelectImage={(nextIndex) => setSelectedImage(nextIndex)}
        />
      }
      title={event.title}
      titleSize="text-lg"
      description={description}
      descriptionAsHtml={!bookingEvent && containsHtmlMarkup(event.description)}
      descriptionLines={3}
      tags={categoryTags}
      extraInfo={extraInfo}
      buttonLabel="Mehr erfahren"
      className="relative overflow-hidden"
    />
  );

  if (bookingEvent) {
    return (
      <Link
        to="/events/$eventId"
        params={{ eventId: event.id }}
        state={(prev) => ({ ...(prev ?? {}), event })}
        className="h-full w-full"
      >
        {card}
      </Link>
    );
  }

  return (
    <Link to="/events/$eventId" params={{ eventId: event.id }} className="h-full w-full">
      {card}
    </Link>
  );
}

export default EventCard;
