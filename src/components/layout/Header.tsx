 import { Bell, User, LogOut, Command } from 'lucide-react';
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
 import { SafetyLockIndicator, SafetyLockPanel, WhyLockedPanel, useSafetyLock } from '@/components/safety';
 import { useCommandPalette } from '@/components/command';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

 export function Header({ title, subtitle }: HeaderProps) {
   const { isPanelOpen, openPanel, closePanel, isWhyLockedOpen, openWhyLocked, closeWhyLocked } = useSafetyLock();
   const { openPalette } = useCommandPalette();
   
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50 backdrop-blur-sm">
      <div>
        {title && <h1 className="text-lg font-mono text-foreground tracking-tight">{title}</h1>}
        {subtitle && <p className="text-xs font-mono text-muted-foreground">{subtitle}</p>}
      </div>

       <div className="flex items-center gap-4">
         {/* Command Palette Trigger */}
         <button
           onClick={openPalette}
           className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono text-muted-foreground bg-muted/50 border border-border rounded-sm hover:bg-muted hover:text-foreground transition-colors"
         >
           <Command className="w-3 h-3" />
           <span className="hidden sm:inline">Command</span>
           <kbd className="px-1.5 py-0.5 text-[10px] bg-background border border-border rounded-sm">/</kbd>
         </button>
 
         {/* Safety Lock Indicator */}
         <SafetyLockIndicator 
           onUnlockClick={openPanel}
           onWhyLockedClick={openWhyLocked}
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
       <SafetyLockPanel open={isPanelOpen} onOpenChange={(open) => !open && closePanel()} />
       <WhyLockedPanel open={isWhyLockedOpen} onOpenChange={(open) => !open && closeWhyLocked()} />
     </header>
  );
}
