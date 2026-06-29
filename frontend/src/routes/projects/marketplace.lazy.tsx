import { createLazyFileRoute } from '@tanstack/react-router';
import { ProjectsMarketplacePage } from '@/components/public-content/ProjectsMarketplacePage';

export const Route = createLazyFileRoute('/projects/marketplace')({
  component: Component,
})

function Component() {
  return <ProjectsMarketplacePage />;
}
