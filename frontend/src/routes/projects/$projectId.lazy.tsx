import { createLazyFileRoute } from '@tanstack/react-router'

import { GatewayProjectDetailPage } from '@/components/public-content/GatewayProjectDetailPage'

export const Route = createLazyFileRoute('/projects/$projectId')({
  component: GatewayProjectDetailRoute,
})

function ProjectDetailRoute({ projectId }: { projectId: string }) {
  return <GatewayProjectDetailPage projectId={projectId} />
}

function GatewayProjectDetailRoute() {
  const { projectId } = Route.useParams()

  return <ProjectDetailRoute projectId={projectId} />
}
