import { createLazyFileRoute } from '@tanstack/react-router'

import { GatewayProjectDetailPage } from '@/components/public-content/GatewayProjectDetailPage'

export const Route = createLazyFileRoute('/projects/$projectId')({
  component: RouteComponent,
})

function RouteComponent() {
  const { projectId } = Route.useParams()

  return <GatewayProjectDetailPage projectId={projectId} />
}
