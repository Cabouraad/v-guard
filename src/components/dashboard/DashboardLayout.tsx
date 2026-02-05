 import { Outlet } from 'react-router-dom';
 import { NavRail } from './NavRail';
 
 export function DashboardLayout() {
   return (
     <div className="flex h-screen bg-background overflow-hidden">
       <NavRail />
       <main className="flex-1 overflow-auto">
         <Outlet />
       </main>
     </div>
   );
 }