import React, { useState, useEffect } from 'react';
import { api } from './api';
import { OverviewData, WarningItem, AssetItem } from './types';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { GuideModal } from './components/GuideModal';
import { CsvUploadModal } from './components/CsvUploadModal';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { WarningsPage } from './pages/WarningsPage';
import { AttackLabPage } from './pages/AttackLabPage';
import { AssetsPage } from './pages/AssetsPage';
import { AlertsPage } from './pages/AlertsPage';

export function App() {
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [warnings, setWarnings] = useState<WarningItem[]>([]);
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [selectedWarningId, setSelectedWarningId] = useState<string | undefined>(undefined);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Theme state: Light theme is DEFAULT per user preference
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('sentinel_theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('sentinel_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const refreshData = async () => {
    const [ov, w, a] = await Promise.all([
      api.getOverview(),
      api.getWarnings(),
      api.getAssets()
    ]);
    setOverview(ov);
    setWarnings(w);
    setAssets(a);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleReset = async () => {
    setResetting(true);
    try {
      await api.resetDemo();
      await refreshData();
    } finally {
      setResetting(false);
    }
  };

  const getPageTitle = () => {
    switch (currentPage) {
      case 'dashboard': return 'Executive Security Dashboard';
      case 'warnings': return 'Early Warning Hub (Threat Intelligence & Matching)';
      case 'attack-lab': return 'Live Attack Lab & Breach Impact Chain';
      case 'assets': return 'Enterprise Monitored Asset Inventory';
      case 'alerts': return 'Multi-Channel Incident Alert Center';
      default: return 'SENTINEL GRID';
    }
  };

  const criticalCount = overview?.bands?.CRITICAL || 0;

  return (
    <div className="flex h-screen bg-slate-100/90 dark:bg-[#070A11] text-slate-800 dark:text-slate-100 overflow-hidden font-sans transition-colors duration-200">
      {/* Clean Left Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        criticalCount={criticalCount}
        unreadAlerts={1}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
      />

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          currentPageTitle={getPageTitle()}
          overview={overview}
          onReset={handleReset}
          onOpenGuide={() => setIsGuideOpen(true)}
          onOpenUpload={() => setIsUploadOpen(true)}
          resetting={resetting}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        {/* Page Content View Area */}
        <main className="flex-1 overflow-y-auto bg-slate-100/70 dark:bg-[#070A11]">
          {currentPage === 'dashboard' && (
            <DashboardPage
              overview={overview}
              warnings={warnings}
              onNavigateToWarnings={() => setCurrentPage('warnings')}
              onNavigateToAttacks={() => setCurrentPage('attack-lab')}
              onNavigateToAssets={() => setCurrentPage('assets')}
              onNavigateToAlerts={() => setCurrentPage('alerts')}
              onOpenUpload={() => setIsUploadOpen(true)}
              onSelectWarning={id => {
                setSelectedWarningId(id);
                setCurrentPage('warnings');
              }}
            />
          )}

          {currentPage === 'warnings' && (
            <WarningsPage
              warnings={warnings}
              selectedWarningId={selectedWarningId}
              onRefresh={refreshData}
            />
          )}

          {currentPage === 'attack-lab' && (
            <AttackLabPage />
          )}

          {currentPage === 'assets' && (
            <AssetsPage assets={assets} />
          )}

          {currentPage === 'alerts' && (
            <AlertsPage />
          )}
        </main>
      </div>

      {/* Operator & Judge Presentation Guide Modal */}
      <GuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* Live CSV Upload & Ingest Modal */}
      <CsvUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={() => {
          refreshData();
        }}
      />
    </div>
  );
}

export default App;
