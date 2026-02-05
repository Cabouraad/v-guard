 import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
 
 export interface RunWindow {
   enabled: boolean;
   timezone: string;
   days: number[]; // 0 = Sunday, 1 = Monday, etc.
   startTime: string; // HH:mm format
   endTime: string; // HH:mm format
 }
 
 interface RunWindowContextType {
   window: RunWindow;
   setWindow: (window: RunWindow) => void;
   isWithinWindow: () => boolean;
   getNextWindowOpen: () => Date | null;
   formatNextWindowOpen: () => string;
 }
 
 const defaultWindow: RunWindow = {
   enabled: false,
   timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
   days: [1, 2, 3, 4, 5], // Monday-Friday
   startTime: '02:00',
   endTime: '06:00',
 };
 
 const RunWindowContext = createContext<RunWindowContextType | null>(null);
 
 const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
 
 export function RunWindowProvider({ children }: { children: ReactNode }) {
   const [window, setWindow] = useState<RunWindow>(defaultWindow);
 
   const isWithinWindow = useCallback((): boolean => {
     if (!window.enabled) return true;
     
     const now = new Date();
     const currentDay = now.getDay();
     const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
     
     if (!window.days.includes(currentDay)) return false;
     
     return currentTime >= window.startTime && currentTime <= window.endTime;
   }, [window]);
 
   const getNextWindowOpen = useCallback((): Date | null => {
     if (!window.enabled || window.days.length === 0) return null;
     
     const now = new Date();
     const currentDay = now.getDay();
     const [startHour, startMinute] = window.startTime.split(':').map(Number);
     
     // Check if we're within window today
     if (isWithinWindow()) return null;
     
     // Find next available day
     for (let i = 0; i <= 7; i++) {
       const checkDay = (currentDay + i) % 7;
       
       if (window.days.includes(checkDay)) {
         const nextDate = new Date(now);
         nextDate.setDate(now.getDate() + i);
         nextDate.setHours(startHour, startMinute, 0, 0);
         
         // If it's today but the window hasn't opened yet
         if (i === 0 && nextDate > now) {
           return nextDate;
         }
         
         // If it's a future day
         if (i > 0) {
           return nextDate;
         }
       }
     }
     
     return null;
   }, [window, isWithinWindow]);
 
   const formatNextWindowOpen = useCallback((): string => {
     const next = getNextWindowOpen();
     if (!next) return 'Window open';
     
     const now = new Date();
     const diffMs = next.getTime() - now.getTime();
     const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
     const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
     
     const dayName = DAYS_OF_WEEK[next.getDay()];
     const time = next.toLocaleTimeString('en-US', { 
       hour: '2-digit', 
       minute: '2-digit',
       hour12: false 
     });
     
     if (diffHours < 24) {
       return `Opens in ${diffHours}h ${diffMins}m (${time})`;
     }
     
     return `Opens ${dayName} ${time}`;
   }, [getNextWindowOpen]);
 
   return (
     <RunWindowContext.Provider value={{
       window,
       setWindow,
       isWithinWindow,
       getNextWindowOpen,
       formatNextWindowOpen,
     }}>
       {children}
     </RunWindowContext.Provider>
   );
 }
 
 export function useRunWindow() {
   const context = useContext(RunWindowContext);
   if (!context) {
     throw new Error('useRunWindow must be used within a RunWindowProvider');
   }
   return context;
 }
 
 export { DAYS_OF_WEEK };