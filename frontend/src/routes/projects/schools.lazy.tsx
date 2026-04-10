import { createLazyFileRoute } from '@tanstack/react-router';
import { ProjectsSchoolsPage } from '@/components/public-content/ProjectsSchoolsPage';

export const Route = createLazyFileRoute('/projects/schools')({
  component: Component,
})

function Component() {
  return <ProjectsSchoolsPage />;
}
