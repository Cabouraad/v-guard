 import { NavLink, useLocation } from 'react-router-dom';
 import { 
   Shield, 
   Activity, 
   Gauge, 
   FileText, 
   Settings,
   ChevronRight
 } from 'lucide-react';
 import { cn } from '@/lib/utils';
 import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
 
 const navItems = [
   { to: '/dashboard', icon: Shield, label: 'Overview', exact: true },
   { to: '/dashboard/scans', icon: Activity, label: 'Scans' },
   { to: '/dashboard/load', icon: Gauge, label: 'Load Testing' },
   { to: '/dashboard/reports', icon: FileText, label: 'Reports' },
   { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
 ];
 
 export function NavRail() {
   const location = useLocation();
 
   const isActive = (path: string, exact?: boolean) => {
     if (exact) return location.pathname === path;
     return location.pathname.startsWith(path);
   };
 
   return (
     <TooltipProvider delayDuration={0}>
       <nav className="flex flex-col items-center w-14 h-screen bg-background border-r border-border py-4">
         {/* Logo */}
         <div className="flex items-center justify-center w-10 h-10 mb-8">
           <Shield className="w-6 h-6 text-primary" />
         </div>
 
         {/* Nav Items */}
         <div className="flex-1 flex flex-col gap-1">
           {navItems.map((item) => {
             const active = isActive(item.to, item.exact);
             return (
               <Tooltip key={item.to}>
                 <TooltipTrigger asChild>
                   <NavLink
                     to={item.to}
                     className={cn(
                       "relative flex items-center justify-center w-10 h-10 rounded-sm transition-colors",
                       active 
                         ? "bg-muted text-primary" 
                         : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                     )}
                   >
                     {active && (
                       <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-primary rounded-r" />
                     )}
                     <item.icon className="w-5 h-5" />
                   </NavLink>
                 </TooltipTrigger>
                 <TooltipContent side="right" className="font-mono text-xs">
                   {item.label}
                 </TooltipContent>
               </Tooltip>
             );
           })}
         </div>
 
         {/* Expand hint */}
         <button className="flex items-center justify-center w-10 h-10 text-muted-foreground/50 hover:text-muted-foreground transition-colors">
           <ChevronRight className="w-4 h-4" />
         </button>
       </nav>
     </TooltipProvider>
   );
 }