import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
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
                <div className="relative flex h-screen bg-bg-page text-text-primary overflow-hidden">
                  <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
                  <main className="flex-1 flex flex-col overflow-y-auto">
                    <Header onMenuClick={() => setIsSidebarOpen(true)} />
                    <div className="p-4 sm:p-6 md:p-8 flex-1">
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
                        <Route path="/policies" element={<div className="text-3xl font-bold">صفحة سياسات فيء</div>} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </div>
                  </main>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;