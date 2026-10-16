import ThankYouPage from '@/components/pages/ThankYouPage';
import '@/styles/pages/thank-you-page.css';

export const metadata = {
  title: 'Thank You',
  openGraph: { title: 'Thank You' },
};

export default function Page() {
  return <ThankYouPage />;
}
