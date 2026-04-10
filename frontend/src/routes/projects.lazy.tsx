import { createLazyFileRoute } from '@tanstack/react-router';
import { Outlet } from '@tanstack/react-router';

export const Route = createLazyFileRoute('/projects')({
  component: Component,
})

function Component() {
  return <Outlet />;
}
