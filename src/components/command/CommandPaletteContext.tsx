 import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { useEvidencePanel } from '@/components/evidence';
 import { useSafetyLock } from '@/components/safety';
 
 interface RecentAction {
   id: string;
   label: string;
   timestamp: number;
 }
 
 interface CommandPaletteContextValue {
   isOpen: boolean;
   openPalette: () => void;
   closePalette: () => void;
   togglePalette: () => void;
   isShortcutsOpen: boolean;
   openShortcuts: () => void;
   closeShortcuts: () => void;
   recentActions: RecentAction[];
   addRecentAction: (action: RecentAction) => void;
 }
 
 const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);
 
 export function useCommandPalette() {
   const context = useContext(CommandPaletteContext);
   if (!context) {
     throw new Error('useCommandPalette must be used within CommandPaletteProvider');
   }
   return context;
 }
 
 interface CommandPaletteProviderProps {
   children: ReactNode;
 }
 
 const MAX_RECENT_ACTIONS = 5;
 
 export function CommandPaletteProvider({ children }: CommandPaletteProviderProps) {
   const [isOpen, setIsOpen] = useState(false);
   const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
   const [recentActions, setRecentActions] = useState<RecentAction[]>([]);
 
   const openPalette = useCallback(() => {
     setIsOpen(true);
     setIsShortcutsOpen(false);
   }, []);
 
   const closePalette = useCallback(() => {
     setIsOpen(false);
   }, []);
 
   const togglePalette = useCallback(() => {
     setIsOpen(prev => !prev);
   }, []);
 
   const openShortcuts = useCallback(() => {
     setIsShortcutsOpen(true);
     setIsOpen(false);
   }, []);
 
   const closeShortcuts = useCallback(() => {
     setIsShortcutsOpen(false);
   }, []);
 
   const addRecentAction = useCallback((action: RecentAction) => {
     setRecentActions(prev => {
       const filtered = prev.filter(a => a.id !== action.id);
       return [action, ...filtered].slice(0, MAX_RECENT_ACTIONS);
     });
   }, []);
 
   // Global Escape handler
   useEffect(() => {
     const handleKeyDown = (e: KeyboardEvent) => {
       if (e.key === 'Escape') {
         if (isOpen) closePalette();
         if (isShortcutsOpen) closeShortcuts();
       }
     };
     window.addEventListener('keydown', handleKeyDown);
     return () => window.removeEventListener('keydown', handleKeyDown);
   }, [isOpen, isShortcutsOpen, closePalette, closeShortcuts]);
 
   return (
     <CommandPaletteContext.Provider
       value={{
         isOpen,
         openPalette,
         closePalette,
         togglePalette,
         isShortcutsOpen,
         openShortcuts,
         closeShortcuts,
         recentActions,
         addRecentAction,
       }}
     >
       {children}
     </CommandPaletteContext.Provider>
   );
 }