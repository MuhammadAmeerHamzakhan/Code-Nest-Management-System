import React, { useEffect, useState } from 'react';
import { supabase } from "../../supabaseClient";
import { 
  TrendingUp, CheckCircle, Clock, 
  Layers, Search, Moon, Bell,
  ChevronDown, BarChart3, PieChart as PieIcon,
  TrendingDown, ArrowUpRight
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, LineChart, Line,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    mrr: 0,
    activeClients: 0,
    completionRate: 0,
    overdueTasks: 0,
    activeProjects: 0,
    statusData: [],
    trendData: [],
    revenueByService: []
  });

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const { data: clients } = await supabase.from('clients').select('*');
      const { data: projects } = await supabase.from('projects').select('*');
      const { data: tasks } = await supabase.from('tasks').select('*');

      // Calculate Real Analytics
      const totalRev = (clients || []).reduce((acc, curr) => acc + Number(curr.monthly_value || 0), 0);
      const activeProjects = (projects || []).filter(p => p.status !== 'Completed').length;
      const finishedTasks = (tasks || []).filter(t => t.status === 'Done').length;
      const taskRate = tasks?.length ? Math.round((finishedTasks / tasks.length) * 100) : 0;

      // Formatting data for Charts
      const projectStatusMapping = [
        { name: 'Planning', value: (projects || []).filter(p => p.status === 'Planning').length },
        { name: 'In Progress', value: (projects || []).filter(p => p.status === 'In Progress').length },
        { name: 'Review', value: (projects || []).filter(p => p.status === 'Review').length },
        { name: 'Completed', value: (projects || []).filter(p => p.status === 'Completed').length },
      ];

      // Mock Trend for the week (Matching Screenshot style)
      const mockTrend = [
        { day: 'Fri', completed: 0, created: 2 },
        { day: 'Sat', completed: 1, created: 1 },
        { day: 'Sun', completed: 0, created: 0 },
        { day: 'Mon', completed: 3, created: 4 },
        { day: 'Tue', completed: 2, created: 1 },
        { day: 'Wed', completed: 5, created: 3 },
        { day: 'Thu', completed: 4, created: 2 },
      ];

      setData({
        mrr: totalRev,
        activeClients: (clients || []).filter(c => c.status === 'Active').length,
        completionRate: taskRate,
        overdueTasks: (tasks || []).filter(t => t.priority === 'High' && t.status !== 'Done').length,
        activeProjects: activeProjects,
        totalTasks: tasks?.length || 0,
        statusData: projectStatusMapping,
        trendData: mockTrend
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444'];

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-[#F8FAFC]">
       <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#6366F1]"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8 font-sans animate-in fade-in duration-500 overflow-x-hidden">
      
      {/* 1. HEADER SECTION (Clean SaaS Header) */}
      <div className="flex justify-between items-start mb-8">
        <div>
           <h1 className="text-3xl font-bold text-slate-800">Analytics</h1>
           <p className="text-slate-500 font-medium mt-1">Track performance and gain insights</p>
        </div>
        <div className="flex gap-4">
           {/* Functional Header controls placeholder to match screenshot */}
           <div className="relative group hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500" size={16}/>
              <input placeholder="Search..." className="bg-white border border-slate-200 py-2.5 pl-10 pr-4 rounded-xl text-sm focus:border-indigo-500 transition-all outline-none" />
           </div>
           <button className="bg-white border border-slate-200 p-2.5 rounded-xl text-slate-500 hover:bg-slate-50"><Moon size={18}/></button>
           <button className="bg-white border border-slate-200 p-2.5 rounded-xl text-slate-500 hover:bg-slate-50"><Bell size={18}/></button>
           <div className="bg-[#6366F1] text-white p-2.5 rounded-xl font-bold text-xs flex items-center gap-2">A <span className="hidden sm:block">Admin</span></div>
        </div>
      </div>

      {/* 2. STATS ROW (4 Columns like screenshot) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
         <TopStat title="Monthly Recurring Revenue" val={`$${data.mrr}`} sub={`${data.activeClients} active clients`} color="text-emerald-500" />
         <TopStat title="Task Completion Rate" val={`${data.completionRate}%`} sub={`${data.totalTasks} total tasks`} color="text-indigo-600" />
         <TopStat title="Overdue Tasks" val={data.overdueTasks} sub="Needs attention" color="text-red-500" />
         <TopStat title="Active Projects" val={data.activeProjects} sub={`${data.activeProjects} in execution`} color="text-purple-600" />
      </div>

      {/* 3. MIDDLE GRAPHS (Revenue & Distribution) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
         <ChartBox title="Revenue by Service Type">
            <div className="flex flex-col items-center justify-center h-[300px]">
               {/* Visual Placeholder for Revenue Doughnut Chart */}
               <div className="relative w-48 h-48 border-4 border-dashed border-slate-100 rounded-full flex items-center justify-center">
                  <PieIcon size={40} className="text-slate-200" />
               </div>
               <p className="text-[11px] text-slate-300 font-bold uppercase mt-6">Metric nodes calculating...</p>
            </div>
         </ChartBox>

         <ChartBox title="Client Status Distribution">
            <div className="h-[300px]">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie
                        data={[
                           { name: 'Active', value: 70 },
                           { name: 'Inactive', value: 20 },
                           { name: 'At Risk', value: 10 },
                        ]}
                        innerRadius={80}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                     >
                        {data.statusData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                     </Pie>
                     <Tooltip />
                  </PieChart>
               </ResponsiveContainer>
            </div>
         </ChartBox>
      </div>

      {/* 4. BOTTOM TRENDS & WORKLOAD */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-8">
         <div className="lg:col-span-3">
            <ChartBox title="Task Completion Trend (7 Days)">
               <div className="h-[300px] mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                     <LineChart data={data.trendData}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                        <Tooltip />
                        <Line type="monotone" dataKey="completed" stroke="#10B981" strokeWidth={3} dot={{r: 4}} />
                        <Line type="monotone" dataKey="created" stroke="#6366F1" strokeWidth={3} dot={{r: 4}} />
                     </LineChart>
                  </ResponsiveContainer>
               </div>
            </ChartBox>
         </div>
         <div className="lg:col-span-2">
            <ChartBox title="Team Workload">
                <div className="flex items-center justify-center h-[300px]">
                   <div className="w-full max-w-[200px] h-[150px] border-2 border-dashed border-slate-100 rounded-3xl" />
                </div>
            </ChartBox>
         </div>
      </div>

      {/* 5. PROJECT OVERVIEW (FULL WIDTH BAR CHART) */}
      <div className="mb-10">
         <ChartBox title="Project Status Overview">
            <div className="h-[350px] mt-6 pr-4">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.statusData} barSize={60}>
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                     <YAxis axisLine={false} tickLine={false} hide />
                     <Tooltip 
                        cursor={{fill: '#f8fafc'}}
                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}}
                     />
                     <Bar dataKey="value" fill="#6366F1" radius={[10, 10, 0, 0]} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </ChartBox>
      </div>
    </div>
  );
}

// ---------------- UI COMPONENTS ---------------- //

function TopStat({ title, val, sub, color }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between transition-transform hover:translate-y-[-4px]">
       <div>
         <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-3">{title}</p>
         <h2 className={`text-4xl font-extrabold tracking-tighter ${color} mb-1`}>{val}</h2>
       </div>
       <p className="text-[11px] font-medium text-slate-500 mt-2">{sub}</p>
    </div>
  );
}

function ChartBox({ title, children }) {
  return (
    <div className="bg-white rounded-[28px] border border-slate-200 p-8 shadow-sm">
       <h3 className="text-base font-bold text-slate-800 tracking-tight">{title}</h3>
       {children}
    </div>
  );
}