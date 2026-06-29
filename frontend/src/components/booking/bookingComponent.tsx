import { useNavigate, useParams } from "@tanstack/react-router";
import PriceCard from "./priceCard";
import { useTranslation } from "react-i18next";
import { DetailPageLayout } from "../ui/DetailPageLayout";
import { TranslatedHtml } from "@/utilities/translateUtils";
import { MapPinIcon } from "lucide-react";
import { BookingErrorState } from "./BookingErrorState";
import { useBookingDetailHydration } from "./useBookingDetailHydration";
import { DetailMediaSection } from "../ui/detailMediaSection";

export default function BookingComponent() {
  const { t } = useTranslation("booking");

  const navigate = useNavigate();
  const { title } = useParams({ from: '/booking/$title' });
  const { booking, isHydrating, hydrationError, retry } = useBookingDetailHydration(title);

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
      heroAlt={title}
      title={title}
      breadcrumbItems={[
        { label: 'Startseite', href: '/' },
        { label: 'Buchungen', href: '/booking' },
        { label: title, href: `/booking/${title}` }
      ]}
      metadata={
        <div className="space-y-4">
          {booking.category && (
            <div className="flex gap-2 flex-wrap">
              <p className="px-4 border-neutral-300 border rounded-full text-sm capitalize">
                {booking.category === 'room' ? 'Raum' : booking.category === 'sport' ? 'Sportanlage' : 'Ressource'}
              </p>
            </div>
          )}

          {booking.location && (
            <div className="space-y-1">
              <p className="flex gap-2 items-center text-neutral-500">
                <MapPinIcon className="size-4" /> Ort
              </p>
              <p className="text-neutral-800">{booking.location}</p>
            </div>
          )}

        </div>
      }
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

        {/* Offers Section */}
        <div>
          <h2 className="font-bold text-xl mb-4">{t("bookingComponent.offer")}</h2>
          <div className="space-y-4">
            {booking.tickets && booking.tickets.length > 0 ? (
              booking.tickets.map((ticket, index) => (
                <PriceCard
                  key={ticket.bkid || index}
                  bookingUrl={ticket.bookingUrl}
                  price={ticket.price}
                  prices={ticket.prices || []}
                  title={ticket.title || title}
                  flags={ticket.flags || booking.flags}
                  location={ticket.location || booking.location}
                  autoCommitNote={ticket.autoCommitNote || booking.autoCommitNote}
                  imgUrl={ticket.imgUrl}
                  tenantId={ticket.tenantId}
                  bookableId={ticket.bkid}
                />
              ))
            ) : (
              <PriceCard
                bookingUrl={booking.bookingUrl}
                price={booking.price}
                prices={booking.prices || []}
                title={title}
                flags={booking.flags}
                location={booking.location}
                autoCommitNote={booking.autoCommitNote}
                imgUrl={booking.imgUrl}
                tenantId={booking.tenantId}
                bookableId={booking.bkid}
              />
            )}
          </div>
        </div>
      </div>
    </DetailPageLayout>
  );
};
