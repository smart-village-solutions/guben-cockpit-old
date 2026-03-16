import { createLazyFileRoute } from '@tanstack/react-router';
import { GatewayProjectsPage } from '@/components/public-content/GatewayProjectsPage';

export const Route = createLazyFileRoute('/projects')({
  component: Component,
})

function Component() {
  return <GatewayProjectsPage />;
}
