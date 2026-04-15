import { useNavigate, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import BookingDivider from "./bookingDivider";
import BookingCard from "./bookingCard";
import { Button } from "../ui/button";
import { ArrowLeftIcon } from "lucide-react";
import { BookingErrorState } from "./BookingErrorState";
import { useBookingDetailHydration } from "./useBookingDetailHydration";

export default function BookingRoom() {
  const { t } = useTranslation("booking");

  const navigate = useNavigate();
  const { title } = useParams({ from: '/booking/room/$title' });
  const { booking, isHydrating, hydrationError, retry } = useBookingDetailHydration(title);
  const rooms = booking?.bookings;

  if (isHydrating && !booking) {
    return (
      <div className="p-6 text-center text-gubenAccent font-semibold">
        {t("bookingComponent.loading")}
      </div>
    );
  }

  if (hydrationError && !booking) {
    return <BookingErrorState error={hydrationError} onRetry={retry} scope="detail" />;
  }

  if (!booking) {
    return (
      <div className="p-6 text-center text-gubenAccent font-semibold">
        {t("bookingComponent.notFound")}
      </div>
    );
  }

  return (
    <div>
      <div className="relative w-full h-72 overflow-hidden">
        <Button
          variant="ghost"
          className='z-10 text-white gap-2 absolute top-4 left-4 flex items-center hover:bg-none'
          onClick={() => navigate({ to: "/booking" })}
        >
          <ArrowLeftIcon className='size-4' />
          <p>{t('AllBookings')}</p>
        </Button>
        <img
          src={booking.imgUrl}
          className="w-full h-full object-cover absolute top-0 left-0" />
        <div className="absolute bottom-0 left-0 w-full h-1/3 flex flex-col items-center justify-center bg-red-600/70">
          <div className="mt-1 text-gubenAccent-foreground font-bold italic text-6xl tracking-tight">
            {title}
          </div>
        </div>
      </div>
      <BookingDivider text={t("our_rooms")} />
      <div id="rooms" className="flex flex-wrap">
        {rooms?.map((room, index) => (
          <BookingCard key={index} booking={room} />
        ))}
      </div>
    </div>
  )
}
