 import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
 import { useCommandPalette } from './CommandPaletteContext';
 import { Separator } from '@/components/ui/separator';
 
 interface ShortcutItem {
   keys: string[];
   description: string;
 }
 
 interface ShortcutGroup {
   title: string;
   shortcuts: ShortcutItem[];
 }
 
 const shortcutGroups: ShortcutGroup[] = [
   {
     title: 'GLOBAL',
     shortcuts: [
       { keys: ['/'], description: 'Open command palette' },
       { keys: ['?'], description: 'Show keyboard shortcuts' },
       { keys: ['Esc'], description: 'Close panels / dialogs' },
     ],
   },
   {
     title: 'NAVIGATION',
     shortcuts: [
       { keys: ['g', 'p'], description: 'Go to Targets' },
       { keys: ['g', 'a'], description: 'Go to Active Scans' },
       { keys: ['g', 'h'], description: 'Go to History' },
       { keys: ['g', 'c'], description: 'Go to Control Center' },
     ],
   },
   {
     title: 'SCAN OPERATIONS',
     shortcuts: [
       { keys: ['n'], description: 'Authorize new scan' },
       { keys: ['h'], description: 'Halt active scan' },
       { keys: ['r'], description: 'Resume paused scan' },
       { keys: ['e'], description: 'Open evidence panel' },
     ],
   },
   {
     title: 'SAFETY CONTROLS',
     shortcuts: [
       { keys: ['s', 'l'], description: 'Toggle safety lock' },
     ],
   },
 ];
 
 export function ShortcutsCheatSheet() {
   const { isShortcutsOpen, closeShortcuts } = useCommandPalette();
 
   return (
     <Dialog open={isShortcutsOpen} onOpenChange={(open) => !open && closeShortcuts()}>
       <DialogContent className="max-w-lg bg-background border-border p-0 gap-0">
         <DialogHeader className="px-4 py-3 border-b border-border">
           <DialogTitle className="font-mono text-sm uppercase tracking-wider">
             Keyboard Shortcuts
           </DialogTitle>
         </DialogHeader>
         
         <div className="max-h-[60vh] overflow-auto">
           {shortcutGroups.map((group, groupIndex) => (
             <div key={group.title}>
               {groupIndex > 0 && <Separator />}
               <div className="px-4 py-3">
                 <h3 className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-3">
                   {group.title}
                 </h3>
                 <div className="space-y-2">
                   {group.shortcuts.map((shortcut, i) => (
                     <div key={i} className="flex items-center justify-between">
                       <span className="text-sm font-mono text-foreground">
                         {shortcut.description}
                       </span>
                       <div className="flex items-center gap-1">
                         {shortcut.keys.map((key, keyIndex) => (
                           <span key={keyIndex} className="flex items-center gap-1">
                             {keyIndex > 0 && (
                               <span className="text-[10px] text-muted-foreground">then</span>
                             )}
                             <kbd className="px-2 py-1 text-[10px] font-mono uppercase bg-muted border border-border rounded-sm text-muted-foreground min-w-[24px] text-center">
                               {key}
                             </kbd>
                           </span>
                         ))}
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
             </div>
           ))}
         </div>
 
         <div className="px-4 py-3 border-t border-border">
           <p className="text-[10px] font-mono text-muted-foreground text-center">
             Press <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded-sm">ESC</kbd> to close
           </p>
         </div>
       </DialogContent>
     </Dialog>
   );
 }