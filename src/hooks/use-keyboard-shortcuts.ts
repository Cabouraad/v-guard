 import { useEffect, useCallback, useRef } from 'react';
 
 type KeySequence = string[];
 type ShortcutHandler = () => void;
 
 interface Shortcut {
   keys: KeySequence;
   handler: ShortcutHandler;
   description: string;
   category: string;
 }
 
 interface UseKeyboardShortcutsOptions {
   enabled?: boolean;
   sequenceTimeout?: number;
 }
 
 export function useKeyboardShortcuts(
   shortcuts: Shortcut[],
   options: UseKeyboardShortcutsOptions = {}
 ) {
   const { enabled = true, sequenceTimeout = 1000 } = options;
   const sequenceRef = useRef<string[]>([]);
   const timeoutRef = useRef<number | null>(null);
 
   const resetSequence = useCallback(() => {
     sequenceRef.current = [];
     if (timeoutRef.current) {
       window.clearTimeout(timeoutRef.current);
       timeoutRef.current = null;
     }
   }, []);
 
   useEffect(() => {
     if (!enabled) return;
 
     const handleKeyDown = (event: KeyboardEvent) => {
       // Ignore if typing in input/textarea/contenteditable
       const target = event.target as HTMLElement;
       if (
         target.tagName === 'INPUT' ||
         target.tagName === 'TEXTAREA' ||
         target.isContentEditable
       ) {
         return;
       }
 
       const key = event.key.toLowerCase();
       
       // Add key to sequence
       sequenceRef.current.push(key);
       
       // Clear any existing timeout
       if (timeoutRef.current) {
         window.clearTimeout(timeoutRef.current);
       }
       
       // Set new timeout to reset sequence
       timeoutRef.current = window.setTimeout(resetSequence, sequenceTimeout);
       
       // Check for matching shortcuts
       for (const shortcut of shortcuts) {
         const sequence = sequenceRef.current;
         const keys = shortcut.keys.map(k => k.toLowerCase());
         
         // Check if current sequence matches
         if (sequence.length === keys.length) {
           const matches = keys.every((k, i) => sequence[i] === k);
           if (matches) {
             event.preventDefault();
             shortcut.handler();
             resetSequence();
             return;
           }
         }
         
         // Check for single-key shortcuts (immediate execution)
         if (keys.length === 1 && sequence.length === 1 && keys[0] === sequence[0]) {
           event.preventDefault();
           shortcut.handler();
           resetSequence();
           return;
         }
       }
       
       // If sequence is too long and no match, reset
       const maxLength = Math.max(...shortcuts.map(s => s.keys.length));
       if (sequenceRef.current.length > maxLength) {
         resetSequence();
       }
     };
 
     window.addEventListener('keydown', handleKeyDown);
     return () => {
       window.removeEventListener('keydown', handleKeyDown);
       if (timeoutRef.current) {
         window.clearTimeout(timeoutRef.current);
       }
     };
   }, [enabled, shortcuts, sequenceTimeout, resetSequence]);
 
   return { resetSequence };
 }