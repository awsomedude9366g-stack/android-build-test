import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DetectPage from "./pages/DetectPage";
import HumanizePage from "./pages/HumanizePage";
import SimilarityPage from "./pages/SimilarityPage";
import HomePage from "./pages/HomePage";
import HistoryPage from "./pages/HistoryPage";
import SettingsPage from "./pages/SettingsPage";
import VerticalNav from "./components/VerticalNav";

const queryClient = new QueryClient();

type Page = 'home' | 'detect' | 'humanize' | 'similarity' | 'history' | 'settings';

function AppShell() {
  const [activePage, setActivePage] = useState<Page>('home');

  return (
    <div
      className="bg-background"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100dvh',
        display: 'flex',
        flexDirection: 'row',
        overflow: 'hidden',
      }}
    >
      {/* Main content area */}
      <div
        style={{
          flex: 1,
          width: 'calc(100vw - 56px)',
          height: '100dvh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activePage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
          >
            {activePage === 'home' && <HomePage onNavigate={(t) => setActivePage(t as Page)} />}
            {activePage === 'detect' && <DetectPage onBack={() => setActivePage('home')} />}
            {activePage === 'humanize' && <HumanizePage onBack={() => setActivePage('home')} />}
            {activePage === 'similarity' && <SimilarityPage onBack={() => setActivePage('home')} />}
            {activePage === 'history' && <HistoryPage />}
            {activePage === 'settings' && <SettingsPage />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Right nav */}
      <VerticalNav activeTab={activePage} onNavigate={(t) => setActivePage(t as Page)} />
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <AppShell />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
