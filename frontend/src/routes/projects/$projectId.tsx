import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/projects/$projectId')({
  beforeLoad: ({ params }) => {
    if (/^\d+$/.test(params.projectId)) {
      throw redirect({
        to: '/projects',
        search: { categoryIds: [], sort: 'name', direction: 'asc', page: 1, pageSize: 12 },
        replace: true,
      })
    }
  },
})
