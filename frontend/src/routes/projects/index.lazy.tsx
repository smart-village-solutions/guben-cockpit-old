import { createLazyFileRoute } from '@tanstack/react-router';
import { GatewayProjectsPage } from '@/components/public-content/GatewayProjectsPage';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

export const Route = createLazyFileRoute('/projects/')({
  component: Component,
})

function Component() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <div className="w-full h-full flex flex-col">
      <Breadcrumb items={[
        { label: 'Startseite', href: '/' },
        { label: 'Mein Guben', href: '/projects' }
      ]} />
      <article className="max-w-7xl mx-auto px-4 w-full pb-5">
        <div className="flex gap-3 flex-col">
          <h1 className="text-gubenAccent font-poppins text-h1 font-bold">
            Willkommen in der Projektübersicht
          </h1>
          <p className="text-base text-gray-700">
            Herzlich willkommen in der Projektübersicht laufender Aktivitäten der Verwaltung auf dem Guben Cockpit! Die Stadtverwaltung Guben möchte Sie einladen, sich über Entwicklungen und Aktivitäten in Guben zu informieren und dazu mit Ihnen ins Gespräch zu kommen. Durch Beteiligung der Gubener Bürgerschaft an Entwicklungsprozessen werden die unterschiedlichen Interessen verschiedener Zielgruppen berücksichtigt. Ziel ist es Guben gemeinsam mit Ihnen zu entwickeln. Lassen Sie uns, unter dem Motto Smarter Wandel mit Beteiligung, Guben gemeinsam gestalten.
          </p>
        </div>
      </article>
      <GatewayProjectsPage
        search={search}
        onSearchChange={(next) => void navigate({ search: () => next as never, replace: true })}
      />
    </div>
  );
}
