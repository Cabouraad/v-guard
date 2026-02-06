import { Outlet } from 'react-router-dom';
import { NavRail } from './NavRail';
import { OnboardingChecklist } from '@/components/onboarding';

export function DashboardLayout() {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <NavRail />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
      <OnboardingChecklist />
    </div>
  );
}
