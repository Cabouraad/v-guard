 import { useState } from 'react';
 import { Bell, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
 import { Avatar, AvatarFallback } from '@/components/ui/avatar';
 import { SafetyLockIndicator, SafetyLockPanel, WhyLockedPanel } from '@/components/safety';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

 export function Header({ title, subtitle }: HeaderProps) {
   const [unlockPanelOpen, setUnlockPanelOpen] = useState(false);
   const [whyLockedPanelOpen, setWhyLockedPanelOpen] = useState(false);
 
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50 backdrop-blur-sm">
      <div>
        {title && <h1 className="text-lg font-mono text-foreground tracking-tight">{title}</h1>}
        {subtitle && <p className="text-xs font-mono text-muted-foreground">{subtitle}</p>}
      </div>

       <div className="flex items-center gap-4">
         {/* Safety Lock Indicator */}
         <SafetyLockIndicator 
           onUnlockClick={() => setUnlockPanelOpen(true)}
           onWhyLockedClick={() => setWhyLockedPanelOpen(true)}
         />
 
         {/* Alerts */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-severity-critical rounded-full" />
        </Button>

        {/* Operator Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <Avatar className="w-8 h-8 rounded-sm">
                <AvatarFallback className="bg-primary/20 text-primary text-sm font-mono rounded-sm">
                  U
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-mono text-xs">OPERATOR SESSION</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="font-mono text-xs">
              <User className="w-4 h-4 mr-2" />
              Config
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive font-mono text-xs">
              <LogOut className="w-4 h-4 mr-2" />
              Terminate Session
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
       </div>
 
       {/* Safety Lock Panels */}
       <SafetyLockPanel open={unlockPanelOpen} onOpenChange={setUnlockPanelOpen} />
       <WhyLockedPanel open={whyLockedPanelOpen} onOpenChange={setWhyLockedPanelOpen} />
     </header>
  );
}
