import Script from 'next/script';
import ApplicationPage from '@/components/pages/ApplicationPage';
import '@/styles/pages/application.css';

export const metadata = {
  title: 'Apply for Calisthenics Training',
  openGraph: { title: 'Apply for Calisthenics Training' },
};

export default function Page() {
  return (
    <>
      {/* Same page tracking code as the GHL page header. */}
      <Script id="application-lead" strategy="afterInteractive">{`window.fbq && fbq('track', 'Lead');`}</Script>
      <ApplicationPage />
    </>
  );
}
