import React, { useState, useEffect } from 'react';
import { api, authStorage } from './api';
import { OverviewData, WarningItem, AssetItem, UserProfile } from './types';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { GuideModal } from './components/GuideModal';
import { CsvUploadModal } from './components/CsvUploadModal';
import { LandingPage } from './components/LandingPage';
import { ShieldAlert, Loader2 } from 'lucide-react';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { WarningsPage } from './pages/WarningsPage';
import { AttackLabPage } from './pages/AttackLabPage';
import { AssetsPage } from './pages/AssetsPage';
import { AlertsPage } from './pages/AlertsPage';
import { AuditPage } from './pages/AuditPage';
import { BlueprintPage } from './pages/BlueprintPage';

export function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => authStorage.getUser());
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [warnings, setWarnings] = useState<WarningItem[]>([]);
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [selectedWarningId, setSelectedWarningId] = useState<string | undefined>(undefined);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

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

  // Verify auth session on load
  useEffect(() => {
    let isMounted = true;
    api.getCurrentUser()
      .then(user => {
        if (isMounted) {
          setCurrentUser(user);
          setIsAuthChecking(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsAuthChecking(false);
        }
      });
    return () => { isMounted = false; };
  }, []);

  const refreshData = async () => {
    setDataLoading(true);
    setDataError(null);
    try {
      const [ov, w, a] = await Promise.all([
        api.getOverview(),
        api.getWarnings(),
        api.getAssets()
      ]);
      setOverview(ov);
      setWarnings(w);
      setAssets(a);
    } catch (err: any) {
      setDataError(err.message || 'Failed to sync with SENTINEL GRID backend services');
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      refreshData();
    }
  }, [currentUser]);

  const handleReset = async () => {
    setResetting(true);
    try {
      await api.resetDemo();
      await refreshData();
    } finally {
      setResetting(false);
    }
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
  };

  if (isAuthChecking) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mb-4" />
        <p className="text-xs font-mono text-slate-400">Verifying cryptographically signed session...</p>
      </div>
    );
  }

  // If not authenticated, render minimal landing page with judge quick-demo & real login/register
  if (!currentUser) {
    return (
      <LandingPage
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          refreshData();
        }}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  const getPageTitle = () => {
    switch (currentPage) {
      case 'dashboard': return 'Executive Dashboard';
      case 'warnings': return 'Early Warning Hub';
      case 'attack-lab': return 'Attack Lab & Kill Chain';
      case 'assets': return 'Asset Inventory';
      case 'alerts': return 'Incident Alert Center';
      case 'audit': return 'Cryptographic Audit Trail';
      case 'blueprint': return 'AI & Scoring Blueprint';
      default: return 'SENTINEL GRID';
    }
  };

  const criticalCount = overview?.bands?.CRITICAL ?? warnings.filter(w => w.band === 'CRITICAL').length;

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

      {/* Main Workspace Column: Flex-1 child with min-w-0 to fluidly fill remaining space */}
      <div className="flex-1 flex flex-col min-w-0 w-full overflow-hidden">
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
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        {/* Page Content View Area */}
        <main className="flex-1 overflow-y-auto bg-slate-100/70 dark:bg-[#070A11] min-w-0 w-full">
          {currentPage === 'dashboard' && (
            <DashboardPage
              overview={overview}
              warnings={warnings}
              loading={dataLoading}
              error={dataError}
              onRetry={refreshData}
              onNavigateToWarnings={() => setCurrentPage('warnings')}
              onNavigateToAttacks={() => setCurrentPage('attack-lab')}
              onNavigateToAssets={() => setCurrentPage('assets')}
              onNavigateToAlerts={() => setCurrentPage('alerts')}
              onNavigateToAudit={() => setCurrentPage('audit')}
              onNavigateToBlueprint={() => setCurrentPage('blueprint')}
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
              loading={dataLoading}
              error={dataError}
              onRefresh={refreshData}
              onOpenUpload={() => setIsUploadOpen(true)}
            />
          )}

          {currentPage === 'attack-lab' && (
            <AttackLabPage />
          )}

          {currentPage === 'assets' && (
            <AssetsPage
              assets={assets}
              loading={dataLoading}
              error={dataError}
              onRefresh={refreshData}
              onOpenUpload={() => setIsUploadOpen(true)}
            />
          )}

          {currentPage === 'alerts' && (
            <AlertsPage
              warnings={warnings}
              loading={dataLoading}
              error={dataError}
              onRefresh={refreshData}
            />
          )}

          {currentPage === 'audit' && (
            <AuditPage />
          )}

          {currentPage === 'blueprint' && (
            <BlueprintPage onNavigate={setCurrentPage} />
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
