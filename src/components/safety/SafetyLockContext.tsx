 import React, { createContext, useContext, useState, ReactNode } from 'react';
 import type { EnvironmentType } from '@/types/database';
 
 export interface AdvancedModules {
   soak: boolean;
   stress: boolean;
   authProbing: boolean;
   injectionTests: boolean;
 }
 
 export interface SafetyLockState {
   isLocked: boolean;
   environment: EnvironmentType | null;
   allowAdvancedTests: boolean;
   approvedForProduction: boolean;
   enabledModules: AdvancedModules;
   riskAcknowledged: boolean;
 }
 
 interface SafetyLockContextType {
   state: SafetyLockState;
   unlock: (config: Omit<SafetyLockState, 'isLocked'>) => void;
   lock: () => void;
   getAuditString: () => string;
 }
 
 const defaultState: SafetyLockState = {
   isLocked: true,
   environment: null,
   allowAdvancedTests: false,
   approvedForProduction: false,
   enabledModules: {
     soak: false,
     stress: false,
     authProbing: false,
     injectionTests: false,
   },
   riskAcknowledged: false,
 };
 
 const SafetyLockContext = createContext<SafetyLockContextType | undefined>(undefined);
 
 export function SafetyLockProvider({ children }: { children: ReactNode }) {
   const [state, setState] = useState<SafetyLockState>(defaultState);
 
   const unlock = (config: Omit<SafetyLockState, 'isLocked'>) => {
     setState({
       ...config,
       isLocked: false,
     });
   };
 
   const lock = () => {
     setState(defaultState);
   };
 
   const getAuditString = (): string => {
     if (state.isLocked) {
       return 'Safety Lock: READ-ONLY';
     }
     const modules = Object.entries(state.enabledModules)
       .filter(([, enabled]) => enabled)
       .map(([name]) => name.toUpperCase())
       .join(', ');
     const prodNote = state.approvedForProduction ? ', PROD-APPROVED' : '';
     return `Safety Lock: ADVANCED (${modules}${prodNote})`;
   };
 
   return (
     <SafetyLockContext.Provider value={{ state, unlock, lock, getAuditString }}>
       {children}
     </SafetyLockContext.Provider>
   );
 }
 
 export function useSafetyLock() {
   const context = useContext(SafetyLockContext);
   if (!context) {
     throw new Error('useSafetyLock must be used within SafetyLockProvider');
   }
   return context;
 }