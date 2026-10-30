import { useTranslation } from "react-i18next";
import { createLazyFileRoute } from '@tanstack/react-router';
import { GatewayProjectsPage } from '@/components/public-content/GatewayProjectsPage';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

export const Route = createLazyFileRoute('/projects/')({
  component: Component,
})

function Component() {
  const { t } = useTranslation("navigation");
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <div className="w-full h-full flex flex-col">
      <Breadcrumb items={[
        { label: t("Home"), href: "/" },
        { label: t("Projects"), href: "/projects" }
      ]} />
      <GatewayProjectsPage
        search={search}
        onSearchChange={(next) => void navigate({ search: () => next as never, replace: true })}
      />
    </div>
  );
}
