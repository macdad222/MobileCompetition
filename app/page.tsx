import { cookies } from 'next/headers';
import { LandingPage } from '@/components/landing-page';
import { GateForm } from '@/components/gate-form';

export default function HomePage() {
  const cookieStore = cookies();
  const accessGranted = cookieStore.get('site_access')?.value === 'granted';

  if (!accessGranted) {
    return <GateForm />;
  }

  return <LandingPage />;
}
