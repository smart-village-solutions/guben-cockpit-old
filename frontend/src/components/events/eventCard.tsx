import type { Event } from "@shared/public-content/contracts";
import { CaretLeftIcon, CaretRightIcon } from "@radix-ui/react-icons";
import { Link } from "@tanstack/react-router";
import { ClockIcon, MapPinIcon } from "lucide-react";
import { useState, useCallback, useMemo, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { getEventImage } from "@/lib/DefaultEventImage";
import { TranslatedHtml, TranslatedText } from "@/utilities/translateUtils";
import { GenericCard } from "@/components/ui/GenericCard";
import { BaseImgTag } from "@/components/ui/BaseImgTag";

interface EventCardProps {
  event: Event;
}

function EventCard({ event }: EventCardProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const { t } = useTranslation("common");

  const adjustIndex = useCallback((toAdd: number) => {
    setSelectedImage(
      (curr) => Math.max(event.images.length - 1, Math.min(0, curr + toAdd))
    );
  }, [event.images.length]);

  // Image carousel component
  const ImageCarousel = () => {
    if (event.images.length > 0 && event.images[selectedImage]) {
      return (
        <div className="text-white relative w-full h-full overflow-hidden group">
          {selectedImage > 0 && event.images.length > 1 && (
            <button
              onClick={() => adjustIndex(-1)}
              className="absolute left-0 top-0 z-10 opacity-0 flex items-center h-full px-2 bg-black bg-opacity-25 hover:cursor-pointer group-hover:opacity-100 transition-opacity"
              aria-label="Previous image"
            >
              <CaretLeftIcon className="size-8" />
            </button>
          )}

          <BaseImgTag
            className="w-full h-full object-cover"
            src={event.images[selectedImage].previewUrl}
            alt="Event"
          />

          {selectedImage < event.images.length - 1 && event.images.length > 1 && (
            <button
              onClick={() => adjustIndex(1)}
              className="absolute right-0 top-0 z-10 opacity-0 flex items-center h-full px-2 bg-black bg-opacity-25 hover:cursor-pointer group-hover:opacity-100 transition-opacity"
              aria-label="Next image"
            >
              <CaretRightIcon className="size-8" />
            </button>
          )}
        </div>
      );
    }

    // Default category image
    const firstCategoryName = event.categories?.[0]?.name ?? null;
    const image = getEventImage(firstCategoryName);

    return image ? (
      <div className="w-full h-full flex items-center justify-center bg-neutral-100">
        <BaseImgTag
          className="w-full h-full object-cover"
          src={image}
          alt={firstCategoryName || "Event category"}
        />
      </div>
    ) : null;
  };

  // Category tags
  const categoryTags = event.categories.map((c) => ({
    id: c.id,
    name: c.name,
  }));

  // Description
  const description = (event as any).isBookingEvent ? (
    <TranslatedHtml
      className="text-sm text-gray-600 line-clamp-3"
      text={event.description}
    />
  ) : (
    <p className="text-sm text-gray-600 line-clamp-3">{event.description}</p>
  );

  // Extra info with location and dates
  const [startDate, endDate] = useMemo(
    () => [new Date(event.startDate), new Date(event.endDate)],
    [event]
  );

  const extraInfo: ReactNode = (
    <div className="space-y-2 flex flex-col">
      <div className="flex items-start gap-2 text-sm">
        <MapPinIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p className="line-clamp-2">
          {event.location.street}, {event.location.zip} {event.location.city}
        </p>
      </div>
      <div className="flex items-start gap-2 text-sm">
        <ClockIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p className="line-clamp-2">
          {startDate.formatDateTime()} - {endDate.formatDateTime()}
        </p>
      </div>
    </div>
  );

  // Link navigation
  const linkProps =
    (event as any).isBookingEvent
      ? { to: "/events/" + event.id, state: { event } }
      : { to: "/events/" + event.id };

  return (
    <Link {...linkProps} className="h-full w-full">
      <GenericCard
        customImageElement={<ImageCarousel />}
        title={event.title}
        titleSize="text-lg"
        description={description}
        descriptionLines={3}
        tags={categoryTags}
        extraInfo={extraInfo}
        buttonLabel="Mehr erfahren"
        className="relative overflow-hidden"
      />
    </Link>
  );
}

export default EventCard;
