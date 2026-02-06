 import { Link } from 'react-router-dom';
 import { Shield } from 'lucide-react';
 
 export function SiteFooter() {
   return (
     <footer className="py-12 px-6 border-t border-border/30">
       <div className="max-w-7xl mx-auto">
         <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
           <div className="flex items-center gap-2">
             <Shield className="w-4 h-4 text-muted-foreground" />
             <span className="text-[11px] font-mono text-muted-foreground">VIBE_SEC v2.0</span>
           </div>
           
           <div className="flex items-center gap-6">
             <Link to="/" className="text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors">
               HOME
             </Link>
             <Link to="/safety" className="text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors">
               SAFETY
             </Link>
             <Link to="/pricing" className="text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors">
               PRICING
             </Link>
             <Link to="/faq" className="text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors">
               FAQ
             </Link>
           </div>
         </div>
         
        <div className="mt-8 pt-6 border-t border-border/20 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[11px] font-mono text-muted-foreground/70">
              Every scan documents what was tested, what was skipped, and why.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-mono text-muted-foreground/50">
                Public Beta — feedback welcome
              </span>
              <a 
                href="mailto:feedback@vibesec.dev" 
                className="text-[10px] font-mono text-primary/70 hover:text-primary transition-colors"
              >
                Provide feedback
              </a>
            </div>
          </div>
       </div>
     </footer>
   );
 }