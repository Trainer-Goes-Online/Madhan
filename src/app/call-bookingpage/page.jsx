import CallBookingPage from '@/components/pages/CallBookingPage';
import '@/styles/pages/call-bookingpage.css';

export const metadata = {
  title: 'Consultation Call Booking',
  openGraph: { title: 'Consultation Call Booking' },
};

export default function Page() {
  return <CallBookingPage />;
}
