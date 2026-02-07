import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Shield, Mail, Lock, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

type AuthMode = 'signin' | 'signup' | 'reset';

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { user, signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Get the intended destination from location state
  const from = (location.state as { from?: string })?.from || '/dashboard/targets';

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          toast({
            title: 'Passwords do not match',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          toast({
            title: 'Password must be at least 6 characters',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password);
        if (error) throw error;
        toast({
          title: 'Check your email',
          description: 'We sent you a confirmation link to verify your account.',
        });
      } else if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) throw error;
        // Navigation handled by useEffect above
      } else if (mode === 'reset') {
        const { error } = await resetPassword(email);
        if (error) throw error;
        toast({
          title: 'Reset email sent',
          description: 'Check your email for password reset instructions.',
        });
        setMode('signin');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-mono text-sm tracking-tight">VIBE_SEC</span>
          </Link>
        </div>
      </header>

      {/* Auth Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-sm bg-primary/10 mb-4">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-xl font-mono tracking-tight">
              {mode === 'signin' && 'Sign In'}
              {mode === 'signup' && 'Create Account'}
              {mode === 'reset' && 'Reset Password'}
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              {mode === 'signin' && 'Access your security dashboard'}
              {mode === 'signup' && 'Start scanning your applications'}
              {mode === 'reset' && 'We\'ll send you a reset link'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-mono">
                EMAIL
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@example.com"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {mode !== 'reset' && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-mono">
                  PASSWORD
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-xs font-mono">
                  CONFIRM PASSWORD
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full font-mono text-xs h-10"
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {mode === 'signin' && 'SIGN IN'}
              {mode === 'signup' && 'CREATE ACCOUNT'}
              {mode === 'reset' && 'SEND RESET LINK'}
            </Button>
          </form>

          <div className="mt-6 space-y-3 text-center">
            {mode === 'signin' && (
              <>
                <button
                  onClick={() => setMode('reset')}
                  className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
                >
                  Forgot password?
                </button>
                <div className="text-xs text-muted-foreground">
                  Don't have an account?{' '}
                  <button
                    onClick={() => setMode('signup')}
                    className="text-primary hover:underline font-mono"
                  >
                    Sign up
                  </button>
                </div>
              </>
            )}

            {mode === 'signup' && (
              <div className="text-xs text-muted-foreground">
                Already have an account?{' '}
                <button
                  onClick={() => setMode('signin')}
                  className="text-primary hover:underline font-mono"
                >
                  Sign in
                </button>
              </div>
            )}

            {mode === 'reset' && (
              <button
                onClick={() => setMode('signin')}
                className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-3 h-3" />
                Back to sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
