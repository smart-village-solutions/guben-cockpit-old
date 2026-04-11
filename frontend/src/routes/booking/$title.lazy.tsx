import BookingComponent from '@/components/booking/bookingComponent'
import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/booking/$title')({
  component: BookingInformation,
})

function BookingInformation() {
  return (
    <div>
      <BookingComponent />
    </div>
  )
}
