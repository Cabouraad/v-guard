 import { useEffect, useState, useMemo } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
 import { useCommandPalette } from './CommandPaletteContext';
 import { useEvidencePanel } from '@/components/evidence';
 import { useSafetyLock } from '@/components/safety';
 import { 
   Target,
   Play,
   Square,
   FileText,
   FileSearch,
   Shield,
   ShieldOff,
   History,
   Activity,
   FolderOpen,
   Clock,
   Keyboard,
   Home
 } from 'lucide-react';
 import { cn } from '@/lib/utils';
 import { toast } from 'sonner';
 
 interface CommandAction {
   id: string;
   label: string;
   shortcut?: string[];
   icon: typeof Target;
   category: 'navigation' | 'scan' | 'evidence' | 'safety' | 'recent';
   action: () => void;
   keywords?: string[];
 }
 
 export function CommandPalette() {
   const { isOpen, closePalette, recentActions, addRecentAction, openShortcuts } = useCommandPalette();
   const { openPanel } = useEvidencePanel();
   const { state: safetyState, openPanel: openSafetyPanel } = useSafetyLock();
   const navigate = useNavigate();
   const [search, setSearch] = useState('');
 
   // Reset search when opening
   useEffect(() => {
     if (isOpen) {
       setSearch('');
     }
   }, [isOpen]);
 
   const executeAction = (action: CommandAction) => {
     action.action();
     addRecentAction({
       id: action.id,
       label: action.label,
       timestamp: Date.now(),
     });
     closePalette();
   };
 
   const actions: CommandAction[] = useMemo(() => [
     // Navigation
     {
       id: 'nav-home',
       label: 'Go to Control Center',
       shortcut: ['g', 'h'],
       icon: Home,
       category: 'navigation',
       action: () => navigate('/dashboard'),
       keywords: ['home', 'dashboard', 'control'],
     },
     {
       id: 'nav-projects',
       label: 'Go to Targets',
       shortcut: ['g', 'p'],
       icon: FolderOpen,
       category: 'navigation',
       action: () => navigate('/projects'),
       keywords: ['projects', 'targets', 'list'],
     },
     {
       id: 'nav-scans',
       label: 'Go to Active Scans',
       shortcut: ['g', 'a'],
       icon: Activity,
       category: 'navigation',
       action: () => navigate('/dashboard/scans'),
       keywords: ['scans', 'active', 'running'],
     },
     {
       id: 'nav-history',
       label: 'Go to Scan History',
       shortcut: ['g', 'h'],
       icon: History,
       category: 'navigation',
       action: () => navigate('/dashboard/scans'),
       keywords: ['history', 'past', 'log'],
     },
     // Scan operations
     {
       id: 'scan-authorize',
       label: 'Authorize New Scan',
       icon: Target,
       category: 'scan',
       action: () => navigate('/projects/new'),
       keywords: ['new', 'start', 'begin', 'create'],
     },
     {
       id: 'scan-halt',
       label: 'Halt Active Scan',
       icon: Square,
       category: 'scan',
       action: () => {
         toast.info('No active scan to halt');
       },
       keywords: ['stop', 'abort', 'cancel'],
     },
     {
       id: 'scan-resume',
       label: 'Resume Paused Scan',
       icon: Play,
       category: 'scan',
       action: () => {
         toast.info('No paused scan to resume');
       },
       keywords: ['continue', 'restart'],
     },
     {
       id: 'export-report',
       label: 'Export Report',
       icon: FileText,
       category: 'scan',
       action: () => {
         toast.info('Select a completed scan to export');
       },
       keywords: ['download', 'pdf', 'html'],
     },
     // Evidence
     {
       id: 'evidence-open',
       label: 'Open Evidence Panel',
       icon: FileSearch,
       category: 'evidence',
       action: () => openPanel({ tab: 'evidence' }),
       keywords: ['logs', 'artifacts', 'inspect'],
     },
     // Safety
     {
       id: 'safety-toggle',
       label: safetyState.isLocked ? 'Unlock Safety Lock (Advanced Mode)' : 'Lock Safety (Read-Only Mode)',
       icon: safetyState.isLocked ? ShieldOff : Shield,
       category: 'safety',
       action: () => openSafetyPanel(),
       keywords: ['lock', 'unlock', 'advanced', 'readonly', 'production'],
     },
     // Meta
     {
       id: 'show-shortcuts',
       label: 'Show Keyboard Shortcuts',
       shortcut: ['?'],
       icon: Keyboard,
       category: 'navigation',
       action: () => openShortcuts(),
       keywords: ['help', 'keys', 'hotkeys'],
     },
   ], [navigate, openPanel, safetyState.isLocked, openSafetyPanel, openShortcuts]);
 
   // Build recent items from stored actions
   const recentItems = useMemo(() => {
     return recentActions
       .map(recent => {
         const action = actions.find(a => a.id === recent.id);
         if (!action) return null;
         return { ...action, category: 'recent' as const };
       })
       .filter(Boolean) as CommandAction[];
   }, [recentActions, actions]);
 
   // Simple fuzzy filter
   const filterActions = (items: CommandAction[], query: string): CommandAction[] => {
     if (!query) return items;
     const lower = query.toLowerCase();
     return items.filter(item => {
       const searchable = [
         item.label,
         ...(item.keywords || []),
         item.category,
       ].join(' ').toLowerCase();
       
       // Simple fuzzy: check if all characters appear in order
       let searchIndex = 0;
       for (const char of lower) {
         const foundIndex = searchable.indexOf(char, searchIndex);
         if (foundIndex === -1) return false;
         searchIndex = foundIndex + 1;
       }
       return true;
     });
   };
 
   const filteredRecent = filterActions(recentItems, search);
   const filteredNavigation = filterActions(actions.filter(a => a.category === 'navigation'), search);
   const filteredScan = filterActions(actions.filter(a => a.category === 'scan'), search);
   const filteredEvidence = filterActions(actions.filter(a => a.category === 'evidence'), search);
   const filteredSafety = filterActions(actions.filter(a => a.category === 'safety'), search);
 
   const renderShortcut = (shortcut?: string[]) => {
     if (!shortcut) return null;
     return (
       <div className="flex items-center gap-0.5 ml-auto">
         {shortcut.map((key, i) => (
           <kbd 
             key={i}
             className="px-1.5 py-0.5 text-[10px] font-mono uppercase bg-muted border border-border rounded-sm text-muted-foreground"
           >
             {key}
           </kbd>
         ))}
       </div>
     );
   };
 
   const renderItem = (action: CommandAction) => (
     <CommandItem
       key={action.id}
       value={action.id}
       onSelect={() => executeAction(action)}
       className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
     >
       <action.icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
       <span className="flex-1 text-sm font-mono">{action.label}</span>
       {renderShortcut(action.shortcut)}
     </CommandItem>
   );
 
   return (
     <CommandDialog 
       open={isOpen} 
       onOpenChange={(open) => !open && closePalette()}
     >
       <Command className="rounded-sm border-0 bg-background" shouldFilter={false}>
         <div className="flex items-center border-b border-border px-3">
           <span className="text-muted-foreground font-mono text-xs mr-2">{'>'}</span>
           <CommandInput 
             placeholder="Type a command..."
             value={search}
             onValueChange={setSearch}
             className="h-12 border-0 focus:ring-0 font-mono text-sm placeholder:text-muted-foreground/50"
           />
         </div>
         <CommandList className="max-h-[400px] overflow-auto">
           <CommandEmpty className="py-8 text-center">
             <p className="text-sm font-mono text-muted-foreground">NO COMMANDS FOUND</p>
             <p className="text-xs font-mono text-muted-foreground/60 mt-1">Try a different search term</p>
           </CommandEmpty>
 
           {filteredRecent.length > 0 && (
             <>
               <CommandGroup heading={
                 <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                   <Clock className="w-3 h-3" />
                   RECENT
                 </span>
               }>
                 {filteredRecent.map(renderItem)}
               </CommandGroup>
               <CommandSeparator />
             </>
           )}
 
           {filteredNavigation.length > 0 && (
             <CommandGroup heading={
               <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                 NAVIGATION
               </span>
             }>
               {filteredNavigation.map(renderItem)}
             </CommandGroup>
           )}
 
           {filteredScan.length > 0 && (
             <CommandGroup heading={
               <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                 SCAN OPERATIONS
               </span>
             }>
               {filteredScan.map(renderItem)}
             </CommandGroup>
           )}
 
           {filteredEvidence.length > 0 && (
             <CommandGroup heading={
               <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                 EVIDENCE
               </span>
             }>
               {filteredEvidence.map(renderItem)}
             </CommandGroup>
           )}
 
           {filteredSafety.length > 0 && (
             <CommandGroup heading={
               <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                 SAFETY CONTROLS
               </span>
             }>
               {filteredSafety.map(renderItem)}
             </CommandGroup>
           )}
         </CommandList>
 
         {/* Footer */}
         <div className="flex items-center justify-between px-3 py-2 border-t border-border text-[10px] font-mono text-muted-foreground">
           <span>Press <kbd className="px-1 py-0.5 bg-muted border border-border rounded-sm">ESC</kbd> to close</span>
           <span>
             <kbd className="px-1 py-0.5 bg-muted border border-border rounded-sm">?</kbd> for all shortcuts
           </span>
         </div>
       </Command>
     </CommandDialog>
   );
 }