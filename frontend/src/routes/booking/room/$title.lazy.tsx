import BookingRoom from '@/components/booking/bookingRoom';
import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/booking/room/$title')({
  component: BookingInformation,
});

function BookingInformation() {
  return (
    <BookingRoom />
  )
};
