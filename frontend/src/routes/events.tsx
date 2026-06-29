import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/events')({
  component: EventsLayout,
})

function EventsLayout() {
  return (
    <div className="w-full h-full flex flex-col">
      <Outlet />
    </div>
  );
}
