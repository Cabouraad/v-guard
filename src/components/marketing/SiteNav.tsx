import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const navLinks = [
  { href: '/', label: 'HOME' },
  { href: '/safety', label: 'SAFETY CONTROLS' },
  { href: '/pricing', label: 'PRICING' },
  { href: '/faq', label: 'FAQ' },
];

export function SiteNav() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleAuthorizeScan = () => {
    if (user) {
      navigate('/dashboard/targets');
    } else {
      navigate('/auth', { state: { from: '/dashboard/targets' } });
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <span className="font-mono text-sm tracking-tight">VIBE_SEC</span>
          <span className="text-[9px] font-mono tracking-widest text-muted-foreground border border-border/50 px-1.5 py-0.5 rounded-sm leading-none">
            BETA
          </span>
        </Link>
        
        <div className="flex items-center gap-8">
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`text-[11px] font-mono tracking-wider transition-colors ${
                  location.pathname === link.href
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
          
          <div className="flex items-center gap-3">
            {user ? (
              <Link to="/dashboard/targets">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="font-mono text-[11px] rounded-sm h-8 border-muted-foreground/30 hover:border-foreground"
                >
                  DASHBOARD
                </Button>
              </Link>
            ) : (
              <Link to="/auth">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="font-mono text-[11px] rounded-sm h-8"
                >
                  SIGN IN
                </Button>
              </Link>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              className="font-mono text-[11px] rounded-sm h-8 border-primary/50 hover:border-primary hover:bg-primary/10"
              onClick={handleAuthorizeScan}
            >
              AUTHORIZE A SCAN
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
