import { createFileRoute } from '@tanstack/react-router'
import { GatewayEventsPage } from '@/components/public-content/GatewayEventsPage'

export const Route = createFileRoute('/events')({
  component: EventsComponent,
})

function EventsComponent() {
  return (
    <div className="w-full h-full flex flex-col">
      <article className="w-full pl-20 pt-5 pr-20 pb-4 flex items-center justify-center">
        <div className="max-w-[1600px] w-full pb-5">
          <div className="flex gap-3 flex-col">
            <h1 className="text-gubenAccent font-poppins text-h1 font-bold">
              Willkommen in der Veranstaltungsübersicht
            </h1>
            <p className="text-base text-gray-700">
              Herzlich Willkommen in der Veranstaltungsübersicht auf dem Guben Cockpit! Guben unterstützt insbesondere neue, barrierefreie Konzepte und Projekte damit alle Bevölkerungsgruppen von der Digitalisierung profitieren können. Das Ziel ist es mit Ihnen gemeinsam in Guben aktiv zu sein. Lassen Sie uns unter dem Motto "Grenzenlos smart" gemeinsam Zeit in Guben und Umgebung verbringen.
            </p>
          </div>
        </div>
      </article>
      <GatewayEventsPage />
    </div>
  );
}
