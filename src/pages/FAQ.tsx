 import { Link } from 'react-router-dom';
 import { ChevronRight } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { SiteNav, SiteFooter } from '@/components/marketing';
 
const faqs = [
  {
    question: 'Does this do both security scanning and load testing?',
    answer: 'Yes. Security analysis runs first, then controlled performance/load testing is applied to the same surfaces — all within strict safety guardrails.',
  },
  {
    question: 'Is this a penetration test?',
    answer: 'No. It is a safety-first analysis tool designed to identify risks and failure modes without destructive behavior by default.',
  },
  {
    question: 'Is it safe for production?',
    answer: 'Baseline checks are production-safe. Heavier testing requires explicit approval and includes strict rate limits and a halt switch.',
  },
  {
    question: 'What do I need to provide?',
    answer: 'At minimum: a URL and permission. For deeper analysis: a test account or token. For best results: staging access.',
  },
  {
    question: "What does 'public beta' mean?",
    answer: 'The core platform is production-safe and feature-complete for security analysis and load testing. Public beta indicates that we are expanding automation, integrations, and reporting based on real-world usage and feedback.',
  },
  {
    question: 'Is it safe to use this on real applications?',
    answer: 'Yes. All scans are read-only by default, explicitly authorized, rate-limited, and environment-aware. Advanced testing requires deliberate operator approval.',
  },
];
 
 export default function FAQ() {
   return (
     <div className="min-h-screen bg-background text-foreground">
       <SiteNav />
 
       {/* Hero */}
       <section className="pt-24 pb-16 px-6">
         <div className="max-w-3xl mx-auto">
           <span className="text-[10px] font-mono text-muted-foreground tracking-widest">QUESTIONS</span>
           <h1 className="text-3xl md:text-4xl font-mono font-light tracking-tight leading-tight mt-3 mb-6">
             Frequently Asked Questions
           </h1>
         </div>
       </section>
 
       {/* FAQ List */}
       <section className="py-8 px-6">
         <div className="max-w-3xl mx-auto">
           <div className="divide-y divide-border/30">
             {faqs.map((faq, i) => (
               <div key={i} className="py-8">
                 <h2 className="text-sm font-mono text-foreground mb-4">
                   Q: {faq.question}
                 </h2>
                 <p className="text-sm text-muted-foreground leading-relaxed pl-4 border-l-2 border-primary/30">
                   {faq.answer}
                 </p>
               </div>
             ))}
           </div>
         </div>
       </section>
 
       {/* More Questions */}
       <section className="py-16 px-6 border-t border-border/30 bg-card/20">
         <div className="max-w-3xl mx-auto">
           <h3 className="text-sm font-mono tracking-wider mb-6">STILL HAVE QUESTIONS?</h3>
           <p className="text-sm text-muted-foreground mb-6">
             Review our safety controls documentation or authorize a scan to see the tool in action.
           </p>
           <div className="flex flex-col sm:flex-row gap-3">
             <Link to="/safety">
               <Button variant="outline" className="font-mono text-[11px] rounded-sm h-10 px-6 border-border hover:bg-muted/30">
                 VIEW SAFETY CONTROLS
               </Button>
             </Link>
             <Link to="/projects/new">
               <Button className="font-mono text-[11px] rounded-sm h-10 px-6 bg-primary hover:bg-primary/90">
                 AUTHORIZE A SCAN
                 <ChevronRight className="w-4 h-4 ml-1" />
               </Button>
             </Link>
           </div>
         </div>
       </section>
 
       <SiteFooter />
     </div>
   );
 }