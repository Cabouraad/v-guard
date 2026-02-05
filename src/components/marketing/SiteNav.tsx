 import { Link, useLocation } from 'react-router-dom';
 import { Shield } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 
 const navLinks = [
   { href: '/', label: 'HOME' },
   { href: '/safety', label: 'SAFETY CONTROLS' },
   { href: '/pricing', label: 'PRICING' },
   { href: '/faq', label: 'FAQ' },
 ];
 
 export function SiteNav() {
   const location = useLocation();
 
   return (
     <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur-sm">
       <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
         <Link to="/" className="flex items-center gap-2">
           <Shield className="w-5 h-5 text-primary" />
           <span className="font-mono text-sm tracking-tight">VIBE_SEC</span>
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
           
           <Link to="/projects/new">
             <Button 
               variant="outline" 
               size="sm" 
               className="font-mono text-[11px] rounded-sm h-8 border-primary/50 hover:border-primary hover:bg-primary/10"
             >
               AUTHORIZE A SCAN
             </Button>
           </Link>
         </div>
       </div>
     </nav>
   );
 }