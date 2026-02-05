 import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
 
 export type EvidenceTabType = 'evidence' | 'artifacts' | 'logs';
 
 export interface EvidenceFilter {
   findingId?: string;
   taskType?: string;
   moduleKey?: string;
   correlationId?: string;
 }
 
 interface EvidencePanelContextValue {
   isOpen: boolean;
   activeTab: EvidenceTabType;
   filter: EvidenceFilter;
   openPanel: (options?: { tab?: EvidenceTabType; filter?: EvidenceFilter }) => void;
   closePanel: () => void;
   setActiveTab: (tab: EvidenceTabType) => void;
   setFilter: (filter: EvidenceFilter) => void;
   clearFilter: () => void;
 }
 
 const EvidencePanelContext = createContext<EvidencePanelContextValue | null>(null);
 
 export function useEvidencePanel() {
   const context = useContext(EvidencePanelContext);
   if (!context) {
     throw new Error('useEvidencePanel must be used within EvidencePanelProvider');
   }
   return context;
 }
 
 interface EvidencePanelProviderProps {
   children: ReactNode;
 }
 
 export function EvidencePanelProvider({ children }: EvidencePanelProviderProps) {
   const [isOpen, setIsOpen] = useState(false);
   const [activeTab, setActiveTab] = useState<EvidenceTabType>('evidence');
   const [filter, setFilter] = useState<EvidenceFilter>({});
 
   const openPanel = useCallback((options?: { tab?: EvidenceTabType; filter?: EvidenceFilter }) => {
     if (options?.tab) {
       setActiveTab(options.tab);
     }
     if (options?.filter) {
       setFilter(options.filter);
     }
     setIsOpen(true);
   }, []);
 
   const closePanel = useCallback(() => {
     setIsOpen(false);
   }, []);
 
   const clearFilter = useCallback(() => {
     setFilter({});
   }, []);
 
   return (
     <EvidencePanelContext.Provider
       value={{
         isOpen,
         activeTab,
         filter,
         openPanel,
         closePanel,
         setActiveTab,
         setFilter,
         clearFilter,
       }}
     >
       {children}
     </EvidencePanelContext.Provider>
   );
 }