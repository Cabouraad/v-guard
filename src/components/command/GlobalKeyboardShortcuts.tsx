 import { useEffect } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { useCommandPalette } from './CommandPaletteContext';
 import { useEvidencePanel } from '@/components/evidence';
 import { useSafetyLock } from '@/components/safety';
 import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
 
 export function GlobalKeyboardShortcuts() {
   const { openPalette, openShortcuts, isOpen: paletteOpen, isShortcutsOpen } = useCommandPalette();
   const { openPanel: openEvidence, closePanel: closeEvidence, isOpen: evidenceOpen } = useEvidencePanel();
   const { openPanel: openSafety, closePanel: closeSafety, isPanelOpen: safetyOpen, closeWhyLocked } = useSafetyLock();
   const navigate = useNavigate();
 
   // Disable shortcuts when modals are open
   const enabled = !paletteOpen && !isShortcutsOpen;
 
   const shortcuts = [
     // Command palette
     {
       keys: ['/'],
       handler: openPalette,
       description: 'Open command palette',
       category: 'global',
     },
     // Shortcuts cheat sheet
     {
       keys: ['?'],
       handler: openShortcuts,
       description: 'Show keyboard shortcuts',
       category: 'global',
     },
     // Navigation: g + key sequences
     {
       keys: ['g', 'p'],
       handler: () => navigate('/projects'),
       description: 'Go to Targets',
       category: 'navigation',
     },
     {
       keys: ['g', 'a'],
       handler: () => navigate('/dashboard/scans'),
       description: 'Go to Active Scans',
       category: 'navigation',
     },
     {
       keys: ['g', 'h'],
       handler: () => navigate('/dashboard/scans'),
       description: 'Go to History',
       category: 'navigation',
     },
     {
       keys: ['g', 'c'],
       handler: () => navigate('/dashboard'),
       description: 'Go to Control Center',
       category: 'navigation',
     },
     // Scan operations
     {
       keys: ['n'],
       handler: () => navigate('/projects/new'),
       description: 'Authorize new scan',
       category: 'scan',
     },
     {
       keys: ['e'],
       handler: () => openEvidence({ tab: 'evidence' }),
       description: 'Open evidence panel',
       category: 'evidence',
     },
     // Safety
     {
       keys: ['s', 'l'],
       handler: openSafety,
       description: 'Toggle safety lock',
       category: 'safety',
     },
   ];
 
   useKeyboardShortcuts(shortcuts, { enabled });
 
   // Handle Escape key separately (works even when modals are open)
   useEffect(() => {
     const handleEscape = (e: KeyboardEvent) => {
       if (e.key === 'Escape') {
         if (evidenceOpen) {
           closeEvidence();
           e.preventDefault();
         }
         if (safetyOpen) {
           closeSafety();
           e.preventDefault();
         }
         closeWhyLocked();
       }
     };
 
     window.addEventListener('keydown', handleEscape);
     return () => window.removeEventListener('keydown', handleEscape);
   }, [evidenceOpen, safetyOpen, closeEvidence, closeSafety, closeWhyLocked]);
 
   return null;
 }