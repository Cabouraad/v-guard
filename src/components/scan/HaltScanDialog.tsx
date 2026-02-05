 import { useState } from 'react';
 import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
 } from '@/components/ui/alert-dialog';
 import { Textarea } from '@/components/ui/textarea';
 import { Label } from '@/components/ui/label';
 import { OctagonX, AlertTriangle } from 'lucide-react';
 
 interface HaltScanDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   onConfirm: (reason: string) => void;
   currentStage: string;
   scanId: string;
 }
 
 export function HaltScanDialog({
   open,
   onOpenChange,
   onConfirm,
   currentStage,
   scanId,
 }: HaltScanDialogProps) {
   const [reason, setReason] = useState('');
 
   const handleConfirm = () => {
     onConfirm(reason);
     setReason('');
   };
 
   const handleCancel = () => {
     setReason('');
     onOpenChange(false);
   };
 
   return (
     <AlertDialog open={open} onOpenChange={onOpenChange}>
       <AlertDialogContent className="max-w-md bg-background border-border">
         <AlertDialogHeader>
           <div className="flex items-center gap-3 mb-2">
             <div className="p-2 rounded-sm bg-severity-critical/10 border border-severity-critical/20">
               <OctagonX className="w-5 h-5 text-severity-critical" />
             </div>
             <AlertDialogTitle className="font-mono text-sm uppercase tracking-wider">
               Halt Scan (Safety Stop)
             </AlertDialogTitle>
           </div>
           <AlertDialogDescription className="text-sm text-muted-foreground space-y-3">
             <p>
               This will safely terminate the scan at the next checkpoint. 
               Any ongoing requests will complete before stopping.
             </p>
             <div className="p-3 rounded-sm bg-muted/50 border border-border">
               <div className="flex items-start gap-2">
                 <AlertTriangle className="w-4 h-4 text-severity-medium mt-0.5 flex-shrink-0" />
                 <div className="text-xs font-mono space-y-1">
                   <p className="text-foreground">
                     Current stage: <span className="text-primary">{currentStage}</span>
                   </p>
                   <p className="text-muted-foreground">
                     Remaining tasks will be marked as canceled.
                   </p>
                 </div>
               </div>
             </div>
           </AlertDialogDescription>
         </AlertDialogHeader>
 
         <div className="space-y-2 py-2">
           <Label htmlFor="halt-reason" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
             Reason (Optional)
           </Label>
           <Textarea
             id="halt-reason"
             placeholder="Why are you halting this scan? (e.g., target unresponsive, wrong environment)"
             value={reason}
             onChange={(e) => setReason(e.target.value)}
             className="h-20 text-sm font-mono resize-none bg-muted/30 border-border focus:border-primary"
           />
         </div>
 
         <AlertDialogFooter className="gap-2 sm:gap-2">
           <AlertDialogCancel 
             onClick={handleCancel}
             className="font-mono text-xs uppercase tracking-wider"
           >
             CANCEL
           </AlertDialogCancel>
           <AlertDialogAction
             onClick={handleConfirm}
             className="bg-severity-critical hover:bg-severity-critical/90 text-white font-mono text-xs uppercase tracking-wider"
           >
             <OctagonX className="w-3.5 h-3.5 mr-1.5" />
             HALT SCAN
           </AlertDialogAction>
         </AlertDialogFooter>
       </AlertDialogContent>
     </AlertDialog>
   );
 }