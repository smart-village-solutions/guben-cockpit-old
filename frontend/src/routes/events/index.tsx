import { createFileRoute } from '@tanstack/react-router'

import { GatewayEventsPage } from '@/components/public-content/GatewayEventsPage'

export const Route = createFileRoute('/events/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <GatewayEventsPage />
}
