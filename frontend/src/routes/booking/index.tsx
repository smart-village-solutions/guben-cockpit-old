import { createFileRoute } from '@tanstack/react-router'
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
import i18next from 'i18next'
import { Language } from '@/utilities/i18n/Languages'
import { translateBatchedMultiple, translateHtmlBatchedMultiple } from '@/utilities/translateUtils'
import { Skeleton } from '@/components/ui/skeleton'

export const Route = createFileRoute('/booking/')({
  component: Booking,
})

function Booking() {
  const { t } = useTranslation("booking");

  const [loading, setLoading] = useState(true)
  const bookables = useBookingStore((state) => state.bookings)
  const processedTenants = useBookingStore((state) => state.processedTenants);
  const markProcessedTenants = useBookingStore((state) => state.markProcessedTenants);

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

  const currentTenant = tenantIds?.tenants[currentTenantIndex];
  const shouldShowIntegration = currentTenant && !processedTenants.has(currentTenant.tenantId);

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
    if (!shouldShowIntegration && currentLang !== "de" && bookables.length > 0) {
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

      translateAll();
    } else {
      setTranslationsReady(true);
    }
  }, [currentLang, shouldShowIntegration]);

  return (
    <main className="w-full h-full flex flex-col">
      <article className="w-full pl-20 pt-5 pr-20 pb-4 flex items-center justify-center">
        <div className="max-w-[1600px] w-full pb-5">
          <div className="flex gap-3 flex-col">
            <h1 className="text-gubenAccent font-poppins text-h1 font-bold">
              Willkommen in der Buchungsübersicht
            </h1>
            <p className="text-base text-gray-700">
              Herzlich willkommen auf unserer Buchungsplattform! Hier können Sie bequem und unkompliziert verschiedene Räume, Sportanlagen, Ressourcen und Events der Stadt Guben buchen. Ob für private Veranstaltungen, Vereinstreffen oder geschäftliche Aktivitäten – nutzen Sie unsere modernen Einrichtungen und Ressourcen. Durch digitale Buchungsprozesse möchten wir Ihnen Zeit sparen und die Auslastung unserer städtischen Infrastruktur optimieren. Lassen Sie uns unter dem Motto „Smarter Wandel mit Beteiligung" Guben gemeinsam gestalten und nutzen.
            </p>
          </div>
        </div>
      </article>
      <div>
        {shouldShowIntegration && (
          <BookingIntegration
            key={`${currentTenant.tenantId}`}
            tenantId={currentTenant.tenantId}
            setLoading={setLoading}
            onDone={handleTenantDone}
          />
        )}
        <BookingDivider icon={HouseIcon} text={t("rooms")} />
        <div id="rooms">
          <div className="flex flex-wrap">
            {translationsReady
              ? rooms.map((room, index) => <BookingCard key={index} booking={room} />)
              : Array.from({ length: rooms.length }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 h-80 p-4"
                  />
              ))
            }
          </div>
        </div>
        <BookingDivider icon={TrophyIcon} text={t("sportFacilities")} />
        <div id="sport_facilities">
          <div className="flex flex-wrap">
            {translationsReady
              ? sports.map((bookable, index) => <BookingCard key={`sport-${index}`} booking={bookable} />)
              : Array.from({ length: sports.length }).map((_, i) => (
                  <Skeleton key={i} className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 h-80 p-4" />
                ))
            }
          </div>
        </div>
        <BookingDivider icon={InfoIcon} text={t("resources")} />
        <div id="resources">
          <div className="flex flex-wrap">
            {translationsReady
              ? resources.map((bookable, index) => <BookingCard key={`res-${index}`} booking={bookable} />)
              : Array.from({ length: resources.length }).map((_, i) => (
                  <Skeleton key={i} className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 h-80 p-4" />
                ))
            }
          </div>
        </div>
        <BookingHowItWorks />
        <BookingFaq />
      </div>
    </main>
  )
}
