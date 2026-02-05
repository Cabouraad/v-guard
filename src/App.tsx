 import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import Landing from "@/pages/Landing";
import DashboardOverview from "@/pages/dashboard/DashboardOverview";
import ScansView from "@/pages/dashboard/ScansView";
import LoadTestingView from "@/pages/dashboard/LoadTestingView";
import Projects from "@/pages/Projects";
import NewProject from "@/pages/NewProject";
import ScanView from "@/pages/ScanView";
import Report from "@/pages/Report";
 import NotFound from "./pages/NotFound";
 import { SafetyLockProvider } from "@/components/safety";
 import { EvidencePanelProvider, EvidencePanel } from "@/components/evidence";

const queryClient = new QueryClient();

 const App = () => (
   <QueryClientProvider client={queryClient}>
     <TooltipProvider>
       <SafetyLockProvider>
         <EvidencePanelProvider>
           <Toaster />
           <Sonner />
           <BrowserRouter>
             <Routes>
               {/* Marketing landing page */}
               <Route path="/" element={<Landing />} />
               
               {/* Dashboard with nav rail */}
               <Route path="/dashboard" element={<DashboardLayout />}>
                 <Route index element={<DashboardOverview />} />
                 <Route path="scans" element={<ScansView />} />
                 <Route path="load" element={<LoadTestingView />} />
                 <Route path="reports" element={<Navigate to="/dashboard" replace />} />
                 <Route path="settings" element={<Navigate to="/dashboard" replace />} />
               </Route>
 
               {/* App routes with sidebar layout */}
               <Route element={<AppLayout />}>
                 <Route path="/projects" element={<Projects />} />
                 <Route path="/projects/new" element={<NewProject />} />
                 <Route path="/scans/:scanId" element={<ScanView />} />
                 <Route path="/reports/:reportId" element={<Report />} />
               </Route>
               
               <Route path="*" element={<NotFound />} />
             </Routes>
           </BrowserRouter>
           {/* Global Evidence Panel */}
           <EvidencePanel />
         </EvidencePanelProvider>
       </SafetyLockProvider>
     </TooltipProvider>
   </QueryClientProvider>
 );

export default App;
