import { Bell, User, LogOut, Command, Settings, FlaskConical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { isPanelOpen, openPanel, closePanel, isWhyLockedOpen, openWhyLocked, closeWhyLocked } = useSafetyLock();
  const { openPalette } = useCommandPalette();
  const { user, signOut } = useAuth();
  const { subscription } = useSubscription();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.email) return 'U';
    return user.email.charAt(0).toUpperCase();
  };

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

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <Avatar className="w-8 h-8 rounded-sm">
                <AvatarFallback className="bg-primary/20 text-primary text-sm font-mono rounded-sm">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-mono text-xs">
              {user?.email || 'OPERATOR SESSION'}
            </DropdownMenuLabel>
            {subscription.is_test_user && (
              <div className="px-2 pb-1">
                <Badge variant="outline" className="text-[9px] border-primary text-primary gap-1">
                  <FlaskConical className="w-2.5 h-2.5" />
                  INTERNAL TEST ACCOUNT
                </Badge>
              </div>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="font-mono text-xs cursor-pointer"
              onClick={() => navigate('/config')}
            >
              <Settings className="w-4 h-4 mr-2" />
              Config
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive font-mono text-xs cursor-pointer"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
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
