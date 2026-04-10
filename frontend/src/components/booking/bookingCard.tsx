import { MapPinnedIcon } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Booking } from "@/stores/bookingStore";
import { TranslatedHtml } from "@/utilities/translateUtils";
import { GenericCard } from "@/components/ui/GenericCard";
import { ReactNode } from "react";

type BookingCardProps = {
  booking: Booking;
  columns?: 'two' | 'three';
};

export default function BookingCard({booking, columns = 'three'}: BookingCardProps) {
  const navigate = useNavigate();

  const to = (booking.bookings?.length ?? 0) > 0
    ? `/booking/room/${booking.title}`
    : `/booking/${booking.title}`;

  const columnClasses = columns === 'two'
    ? 'w-full sm:w-1/2 md:w-1/2 lg:w-1/2'
    : 'w-full sm:w-1/3 md:w-1/3 lg:w-1/3';

  const extraInfo: ReactNode = booking.type !== "resource" && (
    <div className="flex flex-row items-center text-sm gap-2">
      <MapPinnedIcon className="w-4 h-4 flex-shrink-0" />
      <span className="line-clamp-2">{booking.location}</span>
    </div>
  );

  const description = (
    <TranslatedHtml
      className="text-sm text-gray-600 line-clamp-3 break-words"
      text={booking.description}
    />
  );

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate({ to });
  };

  return (
    <div className={`${columnClasses} p-4`}>
      <Link to={to} className="text-gubenAccent h-full">
        <GenericCard
          imageUrl={booking.imgUrl}
          imageAlt={booking.title}
          title={booking.title}
          titleSize="text-lg"
          description={description}
          descriptionLines={3}
          extraInfo={extraInfo}
          buttonLabel="Jetzt buchen"
          buttonOnClick={handleButtonClick}
        />
      </Link>
    </div>
  )
}
