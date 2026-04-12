import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MobileBottomNav from './components/MobileBottomNav';
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

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
                <div className="relative flex min-h-[100dvh] overflow-hidden bg-bg-page text-text-primary md:h-screen">
                  <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
                  <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                    <Header onMenuClick={() => setIsSidebarOpen(true)} />
                    <div className="flex-1 px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:pt-6 md:p-8">
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/financial-system" element={<TeamMemberRoute><FinancialSystem /></TeamMemberRoute>} />
                        <Route path="/orphan/:id" element={<OrphanProfile />} />
                        <Route path="/sponsor/:id" element={<SponsorPage />} />
                        <Route path="/payments" element={<SponsorPaymentsPage />} />
                        <Route path="/team/:id" element={<TeamMemberPage />} />
                        <Route path="/orphans" element={<OrphansList />} />
                        <Route path="/sponsors" element={<TeamMemberRoute><SponsorsList /></TeamMemberRoute>} />
                        <Route path="/team" element={<Navigate to="/human-resources" replace />} />
                        <Route path="/messages" element={<Messages />} />
                        <Route path="/human-resources" element={<TeamMemberRoute><HumanResources /></TeamMemberRoute>} />
                        <Route path="/policies" element={<PoliciesPage />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </div>
                  </main>
                  <MobileBottomNav />
                </div>
                </PoliciesNavProvider>
              </ProtectedRoute>
            }
          />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;
