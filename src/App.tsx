import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth";
import { LegacyRedirect } from "@/components/routing/LegacyRedirect";
import Landing from "@/pages/Landing";
import Safety from "@/pages/Safety";
import Pricing from "@/pages/Pricing";
import FAQ from "@/pages/FAQ";
import Support from "@/pages/Support";
import Auth from "@/pages/Auth";
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
                    <Route path="/support" element={<Support />} />
                    
                    {/* Protected Dashboard with nav rail - ALL authenticated routes */}
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <DashboardLayout />
                        </ProtectedRoute>
                      }
                    >
                      {/* Index redirects to targets */}
                      <Route index element={<Navigate to="/dashboard/targets" replace />} />
                      
                      {/* Canonical dashboard routes */}
                      <Route path="targets" element={<Projects />} />
                      <Route path="targets/new" element={<NewProject />} />
                      <Route path="scan-log" element={<ScanLog />} />
                      <Route path="scan-log/:scanRunId" element={<ScanLogDetail />} />
                      <Route path="evidence" element={<Evidence />} />
                      <Route path="evidence/:scanRunId" element={<Evidence />} />
                      <Route path="config" element={<Config />} />
                      
                      {/* Scan view (for new/running scans) */}
                      <Route path="scans/:scanId" element={<ScanView />} />
                      <Route path="reports/:reportId" element={<Report />} />
                    </Route>

                    {/* Legacy route redirects - avoid 404s for existing deep links */}
                    <Route path="/projects" element={<Navigate to="/dashboard/targets" replace />} />
                    <Route path="/projects/new" element={<Navigate to="/dashboard/targets/new" replace />} />
                    <Route path="/scan-log" element={<Navigate to="/dashboard/scan-log" replace />} />
                    <Route path="/scan-log/:scanRunId" element={<LegacyRedirect to="/dashboard/scan-log/:scanRunId" />} />
                    <Route path="/evidence" element={<Navigate to="/dashboard/evidence" replace />} />
                    <Route path="/evidence/:scanRunId" element={<LegacyRedirect to="/dashboard/evidence/:scanRunId" />} />
                    <Route path="/config" element={<Navigate to="/dashboard/config" replace />} />
                    <Route path="/scans/:scanId" element={<LegacyRedirect to="/dashboard/scans/:scanId" />} />
                    <Route path="/reports/:reportId" element={<LegacyRedirect to="/dashboard/reports/:reportId" />} />
                    
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
