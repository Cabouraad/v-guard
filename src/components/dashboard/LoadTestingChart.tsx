 import { useMemo } from 'react';
 import {
   ResponsiveContainer,
   ComposedChart,
   Area,
   Line,
   XAxis,
   YAxis,
   Tooltip,
   ReferenceLine,
 } from 'recharts';
 
 interface LoadDataPoint {
   time: string;
   rps: number;
   p95: number;
   errorRate: number;
   concurrency: number;
 }
 
 // Generate demo load test data with a failure point
 function generateLoadData(): LoadDataPoint[] {
   const data: LoadDataPoint[] = [];
   const steps = 30;
   
   for (let i = 0; i < steps; i++) {
     const concurrency = Math.floor(i * 5) + 10;
     const baseRps = Math.min(concurrency * 8, 280);
     const baseP95 = 50 + (i * 3);
     
     // Simulate failure point around step 20
     const isFailureZone = i >= 18 && i <= 24;
     const isRecovery = i > 24;
     
     let rps = baseRps;
     let p95 = baseP95;
     let errorRate = 0;
     
     if (isFailureZone) {
       const severity = (i - 18) / 6;
       rps = baseRps * (1 - severity * 0.4);
       p95 = baseP95 * (1 + severity * 3);
       errorRate = severity * 0.35;
     } else if (isRecovery) {
       const recovery = (i - 24) / 6;
       rps = baseRps * (0.6 + recovery * 0.3);
       p95 = baseP95 * (1 + (1 - recovery) * 0.5);
       errorRate = (1 - recovery) * 0.1;
     }
     
     data.push({
       time: `${i * 10}s`,
       rps: Math.round(rps),
       p95: Math.round(p95),
       errorRate: Math.round(errorRate * 100) / 100,
       concurrency,
     });
   }
   
   return data;
 }
 
 export function LoadTestingChart() {
   const data = useMemo(() => generateLoadData(), []);
   
   const maxP95 = Math.max(...data.map(d => d.p95));
   const failurePoint = data.findIndex(d => d.errorRate > 0.1);
 
   return (
     <div className="h-full w-full">
       <ResponsiveContainer width="100%" height="100%">
         <ComposedChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
           {/* Minimal grid */}
           <defs>
             <linearGradient id="errorGradient" x1="0" y1="0" x2="0" y2="1">
               <stop offset="0%" stopColor="hsl(0 84% 60%)" stopOpacity={0.3} />
               <stop offset="100%" stopColor="hsl(0 84% 60%)" stopOpacity={0} />
             </linearGradient>
             <linearGradient id="rpsGradient" x1="0" y1="0" x2="0" y2="1">
               <stop offset="0%" stopColor="hsl(173 80% 40%)" stopOpacity={0.2} />
               <stop offset="100%" stopColor="hsl(173 80% 40%)" stopOpacity={0} />
             </linearGradient>
           </defs>
 
           <XAxis 
             dataKey="time" 
             tick={{ fill: 'hsl(215 20% 45%)', fontSize: 10, fontFamily: 'monospace' }}
             axisLine={{ stroke: 'hsl(217 33% 20%)' }}
             tickLine={false}
             interval={4}
           />
           <YAxis 
             yAxisId="left"
             tick={{ fill: 'hsl(215 20% 45%)', fontSize: 10, fontFamily: 'monospace' }}
             axisLine={false}
             tickLine={false}
             width={40}
           />
           <YAxis 
             yAxisId="right"
             orientation="right"
             domain={[0, maxP95 * 1.5]}
             tick={{ fill: 'hsl(215 20% 45%)', fontSize: 10, fontFamily: 'monospace' }}
             axisLine={false}
             tickLine={false}
             width={40}
           />
 
           {/* Failure zone reference */}
           {failurePoint > 0 && (
             <ReferenceLine 
               x={data[failurePoint].time} 
               yAxisId="left"
               stroke="hsl(0 84% 60%)"
               strokeDasharray="4 4"
               strokeOpacity={0.5}
             />
           )}
 
           {/* Error rate area */}
           <Area
             yAxisId="left"
             type="monotone"
             dataKey="errorRate"
             stroke="hsl(0 84% 60%)"
             fill="url(#errorGradient)"
             strokeWidth={0}
           />
 
           {/* RPS area */}
           <Area
             yAxisId="left"
             type="monotone"
             dataKey="rps"
             stroke="none"
             fill="url(#rpsGradient)"
           />
 
           {/* RPS line */}
           <Line
             yAxisId="left"
             type="monotone"
             dataKey="rps"
             stroke="hsl(173 80% 40%)"
             strokeWidth={2}
             dot={false}
           />
 
           {/* P95 latency line */}
           <Line
             yAxisId="right"
             type="monotone"
             dataKey="p95"
             stroke="hsl(45 93% 47%)"
             strokeWidth={1.5}
             dot={false}
             strokeDasharray="2 2"
           />
 
           <Tooltip
             contentStyle={{
               backgroundColor: 'hsl(222 47% 8%)',
               border: '1px solid hsl(217 33% 20%)',
               borderRadius: '2px',
               fontFamily: 'monospace',
               fontSize: '11px',
             }}
             labelStyle={{ color: 'hsl(210 40% 98%)' }}
             formatter={(value: number, name: string) => {
               const labels: Record<string, string> = {
                 rps: 'RPS',
                 p95: 'P95 (ms)',
                 errorRate: 'Error Rate',
               };
               const formatted = name === 'errorRate' ? `${(value * 100).toFixed(1)}%` : value;
               return [formatted, labels[name] || name];
             }}
           />
         </ComposedChart>
       </ResponsiveContainer>
     </div>
   );
 }