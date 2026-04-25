import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MobileBottomNav from './components/MobileBottomNav';
import OfflineBanner from './components/OfflineBanner';
import PwaUpdatePrompt from './components/PwaUpdatePrompt';
import Dashboard from './components/Dashboard';
import OrphanProfile from './components/OrphanProfile';
import SponsorPage from './components/SponsorPage';
import SponsorPaymentsPage from './components/SponsorPaymentsPage';
import TeamMemberPage from './components/TeamMemberPage';
import FinancialSystem from './components/FinancialSystem';
import OrphansList from './components/OrphansList';
import SponsorsList from './components/SponsorsList';
import Messages from './components/Messages';
import HumanResources from './components/HumanResources';
import { PoliciesPage } from './components/policies/PoliciesPage';
import { PoliciesNavProvider } from './components/policies/PoliciesNavContext';
import SignIn from './components/SignIn';
import ProtectedRoute from './components/ProtectedRoute';
import TeamMemberRoute from './components/TeamMemberRoute';
import AccessRoute from './components/AccessRoute';
import ResponsiveState from './components/ResponsiveState';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { APP_MAIN_SCROLL_ROOT_ID } from './hooks/useBodyScrollLock';
import { useOrganization } from './contexts/OrganizationContext';

function App() {
  const { isOnline } = useNetworkStatus();
  const { canonicalOrigin, organization, resolution } = useOrganization();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(() => {
    try {
      const savedState = localStorage.getItem('sidebar_collapsed');
      return savedState ? JSON.parse(savedState) : false;
    } catch (e) {
      console.error('فشل في قراءة حالة الشريط الجانبي:', e);
      return false;
    }
  });

  const handleSidebarCollapsedChange = React.useCallback((collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed);
    try {
      localStorage.setItem('sidebar_collapsed', JSON.stringify(collapsed));
    } catch {
      // ignore
    }
  }, []);

  if (resolution.kind === 'redirect') {
    return (
      <ResponsiveState
        variant="loading"
        fullScreen
        title="جارٍ فتح نطاق المنظمة"
        description={`ننقلك الآن إلى نطاق ${organization.name} المعتمد.`}
      />
    );
  }

  if (resolution.kind === 'unknown-subdomain') {
    const unknownHostname = resolution.requestedSlug
      ? `${resolution.requestedSlug}.yetim.app`
      : resolution.hostname;

    return (
      <ResponsiveState
        variant="error"
        fullScreen
        title="هذا النطاق غير مهيأ بعد"
        description={`لا توجد منظمة مفعلة على ${unknownHostname}. افتح النطاق الصحيح أو أضف المنظمة إلى إعدادات التطبيق أولاً.`}
      >
        <div className="mt-6 flex w-full flex-col gap-3">
          <button
            type="button"
            onClick={() => window.location.assign(canonicalOrigin)}
            className="min-h-[48px] rounded-xl bg-primary px-4 py-3 font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            فتح نطاق {organization.name}
          </button>
        </div>
      </ResponsiveState>
    );
  }

  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/signin" element={<SignIn />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <PoliciesNavProvider>
                  <div className="relative min-h-[100dvh] overflow-hidden bg-bg-page text-text-primary md:h-screen">
                    <Header />
                    <div className="flex min-h-[100dvh] pt-14 sm:pt-[3.75rem] md:h-screen md:min-h-0 md:pt-16">
                      <Sidebar isCollapsed={isSidebarCollapsed} onCollapsedChange={handleSidebarCollapsedChange} />
                      <main id={APP_MAIN_SCROLL_ROOT_ID} className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                        {!isOnline ? <OfflineBanner /> : null}
                        <div className="flex-1 px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:pt-6 md:p-8">
                          <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/financial-system" element={<AccessRoute access="financial"><FinancialSystem /></AccessRoute>} />
                            <Route path="/orphan/:id" element={<AccessRoute access="orphans"><OrphanProfile /></AccessRoute>} />
                            <Route path="/sponsor/:id" element={<AccessRoute access="sponsors"><SponsorPage /></AccessRoute>} />
                            <Route path="/payments" element={<SponsorPaymentsPage />} />
                            <Route path="/team/:id" element={<TeamMemberPage />} />
                            <Route path="/orphans" element={<AccessRoute access="orphans"><OrphansList isSidebarCollapsed={isSidebarCollapsed} /></AccessRoute>} />
                            <Route path="/sponsors" element={<AccessRoute access="sponsors"><SponsorsList isSidebarCollapsed={isSidebarCollapsed} /></AccessRoute>} />
                            <Route path="/team" element={<Navigate to="/human-resources" replace />} />
                            <Route path="/messages" element={<Messages />} />
                            <Route path="/human-resources" element={<TeamMemberRoute><HumanResources /></TeamMemberRoute>} />
                            <Route path="/policies" element={<PoliciesPage />} />
                            <Route path="*" element={<Navigate to="/" replace />} />
                          </Routes>
                        </div>
                      </main>
                    </div>
                    <MobileBottomNav />
                  </div>
                </PoliciesNavProvider>
              </ProtectedRoute>
            }
          />
        </Routes>
        <PwaUpdatePrompt />
      </HashRouter>
    </AuthProvider>
  );
}

export default App;
