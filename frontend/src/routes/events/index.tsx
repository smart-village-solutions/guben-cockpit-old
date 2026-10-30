import { createFileRoute, type SearchSchemaInput } from '@tanstack/react-router'
import { validateEventsSearch } from '@/components/events/eventSearchState'

export const Route = createFileRoute('/events/')({
  validateSearch: (search: Record<string, unknown> & SearchSchemaInput) => validateEventsSearch(search),
})
