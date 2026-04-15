import { createLazyFileRoute } from '@tanstack/react-router'
import { HouseIcon, InfoIcon, TrophyIcon } from 'lucide-react'
import { useState, useCallback, useMemo, useEffect } from 'react'
import { useBookingStore } from '@/stores/bookingStore'
import { useTranslation } from 'react-i18next'
import { useGatewayBookingTenants } from '@/public-content/hooks'

import BookingCard from '@/components/booking/bookingCard'
import BookingDivider from '@/components/booking/bookingDivider'
import BookingIntegration from '@/components/booking/bookingIntegration'
import BookingHowItWorks from '@/components/booking/bookingHowItWorks'
import BookingFaq from '@/components/booking/bookingFaq'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import i18next from 'i18next'
import { Language } from '@/utilities/i18n/Languages'
import { translateBatchedMultiple, translateHtmlBatchedMultiple } from '@/utilities/translateUtils'
import { BookingErrorState } from '@/components/booking/BookingErrorState'

export const Route = createLazyFileRoute('/booking/')({
  component: Booking,
})

export function Booking() {
  const { t } = useTranslation("booking");

  const [loading, setLoading] = useState(true)
  const bookables = useBookingStore((state) => state.bookings)
  const processedTenants = useBookingStore((state) => state.processedTenants);
  const markProcessedTenants = useBookingStore((state) => state.markProcessedTenants);
  const resetBookings = useBookingStore((state) => state.reset);
  const [bookingError, setBookingError] = useState<unknown>(null);

  const rooms = useMemo(() => bookables.filter((b) => b.category === 'room'), [bookables])
  const resources = useMemo(() => bookables.filter((b) => b.category === 'resource'), [bookables])
  const sports = useMemo(() => bookables.filter((b) => b.category === 'sport'), [bookables])

  const gatewayTenantIdsQuery = useGatewayBookingTenants();
  const tenantIds = gatewayTenantIdsQuery.data;

  const [currentTenantIndex, setCurrentTenantIndex] = useState(0);

  const handleTenantDone = useCallback(() => {
    const currentTenant = tenantIds?.tenants[currentTenantIndex];
    if (currentTenant) {
      markProcessedTenants(currentTenant.tenantId);
    }

    const hasMoreTenants = currentTenantIndex < (tenantIds?.tenants?.length ?? 0) - 1;
    if (hasMoreTenants) {
      setCurrentTenantIndex(i => i + 1);
    } else {
      setLoading(false);
    }
  }, [currentTenantIndex, tenantIds?.tenants, markProcessedTenants]);

  const handleTenantError = useCallback((error: unknown) => {
    setBookingError(error);
    setLoading(false);
  }, []);

  const handleRetry = useCallback(() => {
    resetBookings();
    setCurrentTenantIndex(0);
    setBookingError(null);
    setLoading(true);
  }, [resetBookings]);

  const currentTenant = tenantIds?.tenants[currentTenantIndex];
  const shouldShowIntegration = currentTenant && !processedTenants.has(currentTenant.tenantId) && !bookingError;

  useEffect(() => {
    if (!tenantIds || tenantIds.tenants.length === 0) {
      setLoading(false);
      return;
    }

    if (shouldShowIntegration) {
      setLoading(true);
    }
  }, [shouldShowIntegration, tenantIds]);

  const [translationsReady, setTranslationsReady] = useState(false);
  const currentLang = i18next.language as Language;

  useEffect(() => {
    if (!shouldShowIntegration && !bookingError && currentLang !== "de" && bookables.length > 0) {
      const translateAll = async () => {
        setTranslationsReady(false);
        try {
          const descriptions = bookables
            .map(b => b.description)
            .filter(desc => desc && desc.trim());

          if (descriptions.length > 0) {
            await translateHtmlBatchedMultiple([...new Set(descriptions)], currentLang);
          }

          const otherStringsToTranslate = [
            ...bookables
              .map(b => b.autoCommitNote)
              .filter((note): note is string => note != null && note.trim() !== ''),
            ...bookables
              .flatMap(b => b.flags || [])
              .filter((flag): flag is string => flag != null && flag.trim() !== '')
          ];

          if (otherStringsToTranslate.length > 0) {
            await translateBatchedMultiple([...new Set(otherStringsToTranslate)], currentLang);
          }
        } finally {
          setTranslationsReady(true);
        }
      };

      void translateAll();
    } else {
      setTranslationsReady(true);
    }
  }, [currentLang, shouldShowIntegration, bookables, bookingError]);

  return (
    <main className="w-full h-full flex flex-col">
      <Breadcrumb items={[
        { label: 'Startseite', href: '/' },
        { label: 'Buchungen', href: '/booking' }
      ]} />
      <article className="max-w-7xl mx-auto px-4 w-full pb-5">
        <div className="flex gap-3 flex-col">
          <h1 className="text-gubenAccent font-poppins text-h1 font-bold">
            Willkommen in der Buchungsübersicht
          </h1>
          <p className="text-base text-gray-700">
            Herzlich willkommen auf unserer Buchungsplattform! Hier können Sie bequem und unkompliziert verschiedene Räume, Sportanlagen, Ressourcen und Events der Stadt Guben buchen. Ob für private Veranstaltungen, Vereinstreffen oder geschäftliche Aktivitäten – nutzen Sie unsere modernen Einrichtungen und Ressourcen. Durch digitale Buchungsprozesse möchten wir Ihnen Zeit sparen und die Auslastung unserer städtischen Infrastruktur optimieren. Lassen Sie uns unter dem Motto „Smarter Wandel mit Beteiligung" Guben gemeinsam gestalten und nutzen.
          </p>
        </div>
      </article>
      <div className="w-full flex flex-col items-center">
        {bookingError ? <BookingErrorState error={bookingError} onRetry={handleRetry} /> : null}
        {!bookingError && loading ? (
          <div className="w-full max-w-7xl px-4 py-6 text-neutral-500">{t("overview.loading")}</div>
        ) : null}
        {shouldShowIntegration && currentTenant && (
          <BookingIntegration
            key={`${currentTenant.tenantId}`}
            tenantId={currentTenant.tenantId}
            setLoading={setLoading}
            onDone={handleTenantDone}
            onError={handleTenantError}
          />
        )}
        <div className="max-w-7xl mx-auto px-4 w-full">
          <BookingDivider icon={HouseIcon} text={t("rooms")} />
          <div id="rooms">
            <div className="flex flex-wrap">
              {rooms.length > 0
                ? rooms.map((room, index) => <BookingCard key={index} booking={room} />)
                : <p className="text-neutral-500">{t("noResults")}</p>
              }
            </div>
          </div>
          <BookingDivider icon={TrophyIcon} text={t("sportFacilities")} />
          <div id="sport_facilities">
            <div className="flex flex-wrap">
              {sports.length > 0
                ? sports.map((bookable, index) => <BookingCard key={`sport-${index}`} booking={bookable} />)
                : <p className="text-neutral-500">{t("noResults")}</p>
              }
            </div>
          </div>
          <BookingDivider icon={InfoIcon} text={t("resources")} />
          <div id="resources">
            <div className="flex flex-wrap">
              {resources.length > 0
                ? resources.map((bookable, index) => <BookingCard key={`res-${index}`} booking={bookable} />)
                : <p className="text-neutral-500">{t("noResults")}</p>
              }
            </div>
          </div>
          <BookingHowItWorks />
          <BookingFaq />
        </div>
      </div>
    </main>
  )
}
