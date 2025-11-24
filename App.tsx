import React, { useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import OrphanProfile from './components/OrphanProfile';
import SponsorPage from './components/SponsorPage';
import TeamMemberPage from './components/TeamMemberPage';
import FinancialSystem from './components/FinancialSystem';
import OrphansList from './components/OrphansList';
import SponsorsList from './components/SponsorsList';
import TeamList from './components/TeamList';
import Messages from './components/Messages';
import HumanResources from './components/HumanResources';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <HashRouter>
      <div className="relative flex h-screen bg-bg-page text-text-primary overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 flex flex-col overflow-y-auto">
          <Header onMenuClick={() => setIsSidebarOpen(true)} />
          <div className="p-4 sm:p-6 md:p-8 flex-1">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/financial-system" element={<FinancialSystem />} />
              <Route path="/orphan/:id" element={<OrphanProfile />} />
              <Route path="/sponsor/:id" element={<SponsorPage />} />
              <Route path="/team/:id" element={<TeamMemberPage />} />
              <Route path="/orphans" element={<OrphansList />} />
              <Route path="/sponsors" element={<SponsorsList />} />
              <Route path="/team" element={<TeamList />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/human-resources" element={<HumanResources />} />
              <Route path="/policies" element={<div className="text-3xl font-bold">صفحة سياسات فيء</div>} />
            </Routes>
          </div>
        </main>
      </div>
    </HashRouter>
  );
}

export default App;