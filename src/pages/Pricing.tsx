 import { Link } from 'react-router-dom';
 import { ChevronRight, Check } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { SiteNav, SiteFooter } from '@/components/marketing';
 
 const tiers = [
   {
     name: 'Standard',
     price: '$49',
     period: '/mo',
     description: 'For individual developers and small teams validating their applications.',
     features: [
       'Up to 5 scans/month',
       'URL-only + Authenticated scans',
       'Safe security analysis (read-only)',
       'Baseline performance + light load ramp',
       '30-day artifact retention',
       'Conservative concurrency cap; cooldown enforced',
     ],
     cta: 'AUTHORIZE A SCAN',
     highlighted: false,
   },
   {
     name: 'Production',
     price: '$199',
     period: '/mo',
     description: 'For teams requiring deeper analysis on staging and production systems.',
     features: [
       'Up to 15 scans/month',
       'Authenticated scans (multi-user)',
       'Full security pipeline',
       'Load ramp + soak & recovery testing (staging or explicitly approved)',
       '180-day artifact retention',
       'Priority execution',
     ],
     cta: 'AUTHORIZE A SCAN',
     highlighted: true,
   },
 ];
 
 export default function Pricing() {
   return (
     <div className="min-h-screen bg-background text-foreground">
       <SiteNav />
 
       {/* Hero */}
       <section className="pt-24 pb-16 px-6">
         <div className="max-w-4xl mx-auto text-center">
           <span className="text-[10px] font-mono text-muted-foreground tracking-widest">PLANS</span>
           <h1 className="text-3xl md:text-4xl font-mono font-light tracking-tight leading-tight mt-3 mb-6">
             Pricing
           </h1>
           <p className="text-muted-foreground text-sm leading-relaxed max-w-xl mx-auto">
             Two tiers. No hidden fees. Heavy testing is gated and auditable.
           </p>
         </div>
       </section>
 
       {/* Pricing Grid */}
       <section className="py-12 px-6">
         <div className="max-w-4xl mx-auto">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {tiers.map((tier) => (
               <div
                 key={tier.name}
                 className={`border p-6 ${
                   tier.highlighted
                     ? 'border-primary/50 bg-primary/5'
                     : 'border-border/50 bg-card/30'
                 }`}
               >
                 <div className="mb-6">
                   <h2 className="text-sm font-mono tracking-wider mb-2">{tier.name.toUpperCase()}</h2>
                   <div className="flex items-baseline gap-1">
                     <span className="text-3xl font-mono text-foreground">{tier.price}</span>
                     <span className="text-sm font-mono text-muted-foreground">{tier.period}</span>
                   </div>
                   <p className="text-xs text-muted-foreground mt-2">{tier.description}</p>
                 </div>
 
                 <div className="space-y-3 mb-8">
                   {tier.features.map((feature, i) => (
                     <div key={i} className="flex items-start gap-3">
                       <Check className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${
                         tier.highlighted ? 'text-primary' : 'text-muted-foreground'
                       }`} />
                       <span className="text-sm text-foreground">{feature}</span>
                     </div>
                   ))}
                 </div>
 
                 <Link to="/projects/new">
                   <Button
                     variant={tier.highlighted ? 'default' : 'outline'}
                     className={`w-full font-mono text-[11px] rounded-sm h-10 ${
                       tier.highlighted
                         ? 'bg-primary hover:bg-primary/90'
                         : 'border-border hover:bg-muted/30'
                     }`}
                   >
                     {tier.cta}
                     <ChevronRight className="w-4 h-4 ml-1" />
                   </Button>
                 </Link>
               </div>
             ))}
           </div>
 
           {/* Note */}
           <div className="mt-8 text-center">
             <p className="text-[11px] font-mono text-muted-foreground">
               Heavy testing is gated and auditable.
             </p>
           </div>
         </div>
       </section>
 
       {/* Additional Info */}
       <section className="py-16 px-6 border-t border-border/30 bg-card/20">
         <div className="max-w-4xl mx-auto">
           <h3 className="text-sm font-mono tracking-wider mb-6">WHAT'S INCLUDED IN EVERY PLAN</h3>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {[
               { label: 'Evidence Artifacts', value: 'Yes' },
               { label: 'Audit Trail', value: 'Yes' },
               { label: 'Halt Controls', value: 'Yes' },
               { label: 'DO_NOT_TEST Routes', value: 'Yes' },
             ].map((item, i) => (
               <div key={i} className="p-4 border border-border/50 bg-background/50">
                 <div className="text-sm font-mono text-foreground">{item.value}</div>
                 <div className="text-[10px] font-mono text-muted-foreground tracking-wider mt-1">{item.label}</div>
               </div>
             ))}
           </div>
         </div>
       </section>
 
       <SiteFooter />
     </div>
   );
 }