import { createLazyFileRoute } from '@tanstack/react-router'

import { GatewayProjectDetailPage } from '@/components/public-content/GatewayProjectDetailPage'

export const Route = createLazyFileRoute('/projects/$projectId')({
  component: RouteComponent,
})

export function ProjectDetailRoute({ projectId }: { projectId: string }) {
  return <GatewayProjectDetailPage projectId={projectId} />
}

export function RouteComponent() {
  const { projectId } = Route.useParams()

  return <ProjectDetailRoute projectId={projectId} />
}
