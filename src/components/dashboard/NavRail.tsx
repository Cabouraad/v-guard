import { NavLink, useLocation } from 'react-router-dom';
import { 
  Shield, 
  Crosshair, 
  Activity, 
  FileText, 
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

const navItems = [
  { to: '/dashboard/targets', icon: Crosshair, label: 'Targets' },
  { to: '/dashboard/scan-log', icon: Activity, label: 'Scan Log' },
  { to: '/dashboard/evidence', icon: FileText, label: 'Evidence' },
  { to: '/dashboard/config', icon: Settings, label: 'Config' },
];

export function NavRail() {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <TooltipProvider delayDuration={0}>
      <nav className="flex flex-col items-center w-14 h-screen bg-background border-r border-border py-4">
        {/* Logo */}
        <div className="flex flex-col items-center justify-center mb-8 gap-1">
          <div className="w-10 h-10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <span className="text-[7px] font-mono tracking-widest text-muted-foreground leading-none">BETA</span>
        </div>

        {/* Nav Items */}
        <div className="flex-1 flex flex-col gap-1">
          {navItems.map((item) => {
            const active = isActive(item.to);
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
      </nav>
    </TooltipProvider>
  );
}
