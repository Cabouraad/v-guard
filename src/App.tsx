import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth";
import Landing from "@/pages/Landing";
import Safety from "@/pages/Safety";
import Pricing from "@/pages/Pricing";
import FAQ from "@/pages/FAQ";
import Auth from "@/pages/Auth";
import DashboardOverview from "@/pages/dashboard/DashboardOverview";
import ScansView from "@/pages/dashboard/ScansView";
import LoadTestingView from "@/pages/dashboard/LoadTestingView";
import Projects from "@/pages/Projects";
import NewProject from "@/pages/NewProject";
import ScanView from "@/pages/ScanView";
import Report from "@/pages/Report";
import ScanLog from "@/pages/ScanLog";
import ScanLogDetail from "@/pages/ScanLogDetail";
import Evidence from "@/pages/Evidence";
import Config from "@/pages/Config";
import NotFound from "./pages/NotFound";
import { SafetyLockProvider } from "@/components/safety";
import { EvidencePanelProvider, EvidencePanel } from "@/components/evidence";
import { CommandPaletteProvider, CommandPalette, ShortcutsCheatSheet, GlobalKeyboardShortcuts } from "@/components/command";
import { RunWindowProvider } from "@/components/scheduling";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <SafetyLockProvider>
            <RunWindowProvider>
              <EvidencePanelProvider>
                <CommandPaletteProvider>
                  <Toaster />
                  <Sonner />
                  <GlobalKeyboardShortcuts />
                  <Routes>
                    {/* Public marketing pages */}
                    <Route path="/" element={<Landing />} />
                    <Route path="/safety" element={<Safety />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/faq" element={<FAQ />} />
                    <Route path="/auth" element={<Auth />} />
                    
                    {/* Protected Dashboard with nav rail */}
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <DashboardLayout />
                        </ProtectedRoute>
                      }
                    >
                      <Route index element={<DashboardOverview />} />
                      <Route path="scans" element={<ScansView />} />
                      <Route path="load" element={<LoadTestingView />} />
                      <Route path="reports" element={<Navigate to="/dashboard" replace />} />
                      <Route path="settings" element={<Navigate to="/dashboard" replace />} />
                    </Route>

                    {/* Protected App routes with sidebar layout */}
                    <Route
                      element={
                        <ProtectedRoute>
                          <AppLayout />
                        </ProtectedRoute>
                      }
                    >
                      <Route path="/projects" element={<Projects />} />
                      <Route path="/projects/new" element={<NewProject />} />
                      <Route path="/scans/:scanId" element={<ScanView />} />
                      <Route path="/reports/:reportId" element={<Report />} />
                      <Route path="/scan-log" element={<ScanLog />} />
                      <Route path="/scan-log/:scanRunId" element={<ScanLogDetail />} />
                      <Route path="/evidence" element={<Evidence />} />
                      <Route path="/config" element={<Config />} />
                    </Route>
                    
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  {/* Global Overlays */}
                  <CommandPalette />
                  <ShortcutsCheatSheet />
                  <EvidencePanel />
                </CommandPaletteProvider>
              </EvidencePanelProvider>
            </RunWindowProvider>
          </SafetyLockProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
