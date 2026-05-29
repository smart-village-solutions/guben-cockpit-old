import { useNavigate, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import BookingDivider from "./bookingDivider";
import BookingCard from "./bookingCard";
import { BookingErrorState } from "./BookingErrorState";
import { useBookingDetailHydration } from "./useBookingDetailHydration";
import { DetailPageLayout } from "../ui/DetailPageLayout";
import { DetailMediaSection } from "../ui/detailMediaSection";
import { TranslatedHtml } from "@/utilities/translateUtils";

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

  const images = booking.imgUrl ? [{ src: booking.imgUrl, alt: title }] : [];

  return (
    <DetailPageLayout
      title={title}
      breadcrumbItems={[
        { label: "Startseite", href: "/" },
        { label: "Buchungen", href: "/booking" },
        { label: title, href: `/booking/room/${title}` },
      ]}
      onBack={() => navigate({ to: "/booking" })}
      backLabel={t("AllBookings")}
    >
      <div className="space-y-8">
        <DetailMediaSection
          heading={t("bookingComponent.description")}
          body={(
            <TranslatedHtml
              className="prose max-w-none"
              text={booking.description}
            />
          )}
          images={images}
        />
        <BookingDivider text={t("our_rooms")} />
        <div id="rooms" className="flex flex-wrap">
          {rooms?.map((room, index) => (
            <BookingCard key={index} booking={room} />
          ))}
        </div>
      </div>
    </DetailPageLayout>
  )
}
