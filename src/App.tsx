import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DetectPage from "./pages/DetectPage";
import HumanizePage from "./pages/HumanizePage";
import SimilarityPage from "./pages/SimilarityPage";

const queryClient = new QueryClient();

type Tab = 'detect' | 'humanize' | 'similarity';

function AppShell() {
  const [activeTab, setActiveTab] = useState<Tab>('detect');

  const tabs: { id: Tab; label: string; icon: string; color: string }[] = [
    { id: 'detect', label: 'AI Detector', icon: '🔍', color: 'hsl(var(--destructive))' },
    { id: 'humanize', label: 'Humanizer', icon: '✦', color: 'hsl(var(--success))' },
    { id: 'similarity', label: 'Similarity', icon: '⇄', color: 'hsl(var(--primary))' },
  ];

  return (
    <div className="min-h-svh bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border px-5 py-3 flex items-center justify-between">
        <span className="font-display text-lg text-foreground tracking-tight">ClarityScribe</span>
        <span className="text-[10px] font-mono text-muted-foreground bg-secondary px-2.5 py-1 rounded-full hidden sm:inline-block">AI Writing Toolkit</span>
      </nav>

      {/* Hero */}
      <div className="text-center pt-8 pb-6 px-5">
        <h1 className="font-display text-2xl sm:text-3xl text-foreground">
          Detect. <span className="text-success">Humanize.</span> Compare.
        </h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          The complete AI writing toolkit — powered by Lovable AI
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex justify-center px-5 pb-6">
        <div className="inline-flex bg-card border border-border rounded-full p-1 gap-1 shadow-card">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-foreground text-card shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: tab.color }}
              />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.icon}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-[860px] mx-auto px-5 pb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'detect' && <DetectPage />}
            {activeTab === 'humanize' && <HumanizePage />}
            {activeTab === 'similarity' && <SimilarityPage />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <footer className="text-center py-6 text-[11px] text-muted-foreground/50 font-mono">
        Powered by Lovable AI · ClarityScribe v3
      </footer>
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
