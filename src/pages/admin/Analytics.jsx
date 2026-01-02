import React, { useEffect, useState } from 'react';
import { supabase } from "../../supabaseClient";
import { 
  Search, Moon, Bell,
  BarChart3, PieChart as PieIcon,
  TrendingUp, Users, CheckCircle, Clock
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, LineChart, Line,
  PieChart, Pie, Cell, Tooltip as RechartsTooltip
} from 'recharts';

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    mrr: 0,
    activeClients: 0,
    completionRate: 0,
    overdueTasks: 0,
    activeProjects: 0,
    totalTasks: 0,
    statusData: [],
    trendData: [],
    serviceRevenueData: [],
    workloadData: []
  });

  // THE BRAIN: REAL-TIME DATA AGGREGATION
  useEffect(() => {
    fetchStats();
    
    // Set up global listener to refresh analytics if data changes elsewhere
    const channel = supabase.channel('analytics-sync')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => fetchStats())
      .subscribe();
      
    return () => supabase.removeChannel(channel);
  }, []);

  async function fetchStats() {
    try {
      const [cls, projs, tks, profs] = await Promise.all([
        supabase.from('clients').select('*'),
        supabase.from('projects').select('*'),
        supabase.from('tasks').select('*'),
        supabase.from('profiles').select('id, full_name')
      ]);

      const clients = cls.data || [];
      const projects = projs.data || [];
      const tasks = tks.data || [];
      const profiles = profs.data || [];

      // 1. CALCULATE TOP-LINE KPIS
      const totalRev = clients.reduce((acc, curr) => acc + Number(curr.monthly_value || 0), 0);
      const doneTasks = tasks.filter(t => t.status?.toLowerCase() === 'done').length;
      
      // 2. REVENUE BY SERVICE LOGIC
      // Mapping the array of services in clients to revenue weights
      const serviceMap = {};
      clients.forEach(client => {
        const services = client.services || [];
        if (services.length > 0) {
          const valuePerService = Number(client.monthly_value || 0) / services.length;
          services.forEach(s => {
            serviceMap[s] = (serviceMap[s] || 0) + valuePerService;
          });
        }
      });
      const revenueByService = Object.keys(serviceMap).map(name => ({
        name,
        value: Math.round(serviceMap[name])
      })).sort((a,b) => b.value - a.value);

      // 3. TEAM WORKLOAD LOGIC
      const workloadMap = {};
      tasks.forEach(task => {
        if(task.assigned_to && task.status !== 'Done') {
          const staff = profiles.find(p => p.id === task.assigned_to);
          const name = staff ? staff.full_name : 'System';
          workloadMap[name] = (workloadMap[name] || 0) + 1;
        }
      });
      const workloadData = Object.keys(workloadMap).map(name => ({ name: name.split(' ')[0], tasks: workloadMap[name] }));

      // 4. PROJECT STATUS DISTRIBUTION
      const statusData = [
        { name: 'Planning', value: projects.filter(p => p.status === 'Planning').length },
        { name: 'In Progress', value: projects.filter(p => p.status === 'In Progress').length },
        { name: 'Review', value: projects.filter(p => p.status === 'In Review').length },
        { name: 'Completed', value: projects.filter(p => p.status === 'Completed').length },
      ];

      // 5. CLIENT HEALTH (Donut Chart)
      const healthData = [
        { name: 'Active', value: clients.filter(c => c.status === 'Active').length },
        { name: 'On Hold', value: clients.filter(c => c.status === 'On Hold').length },
        { name: 'At Risk', value: clients.filter(c => c.status === 'At Risk').length },
      ];

      setData({
        mrr: totalRev,
        activeClients: clients.filter(c => c.status === 'Active').length,
        completionRate: tasks.length ? Math.round((doneTasks / tasks.length) * 100) : 0,
        overdueTasks: tasks.filter(t => t.priority === 'High' && t.status !== 'Done').length,
        activeProjects: projects.length,
        totalTasks: tasks.length,
        statusData,
        healthData,
        serviceRevenueData: revenueByService,
        workloadData: workloadData,
        trendData: [
            { day: 'Sat', completed: 0, created: 0 },
            { day: 'Sun', completed: 0, created: 0 },
            { day: 'Mon', completed: 1, created: 2 },
            { day: 'Tue', completed: 2, created: 1 },
            { day: 'Wed', completed: 1, created: 3 },
            { day: 'Thu', completed: doneTasks, created: tasks.length },
            { day: 'Fri', completed: 0, created: 0 },
        ]
      });
    } catch (e) { console.error("Analytics Matrix Fault:", e); }
    finally { setLoading(false); }
  }

  const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444'];

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-[#F8FAFC]">
       <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8 font-sans overflow-x-hidden animate-in fade-in duration-700">
      
      {/* PROFESSIONAL SaaS HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
           <h1 className="text-3xl font-black text-slate-800 tracking-tight italic uppercase">Analytics</h1>
           <p className="text-slate-400 font-bold text-[10px] tracking-widest uppercase">System Execution Insights</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
              <input placeholder="Search Matrix..." className="bg-white border border-slate-200/60 py-2.5 pl-10 pr-4 rounded-[18px] text-xs focus:ring-4 focus:ring-indigo-500/5 outline-none w-64" />
           </div>
           <button className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 shadow-sm hover:text-indigo-600 transition-colors"><Bell size={18}/></button>
           <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-200">A</div>
        </div>
      </div>

      {/* KPIS (TOP ROW) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
         <TopStat title="Monthly Recurring Revenue" val={`$${data.mrr.toLocaleString()}`} sub={`${data.activeClients} active nodes`} color="text-emerald-500" />
         <TopStat title="Task Completion Rate" val={`${data.completionRate}%`} sub={`Out of ${data.totalTasks} tasks`} color="text-indigo-600" />
         <TopStat title="Overdue Tasks" val={data.overdueTasks} sub="Immediate priority" color="text-red-500" />
         <TopStat title="Active Projects" val={data.activeProjects} sub={`${data.totalTasks} total matrix tasks`} color="text-purple-600" />
      </div>

      {/* PRIMARY GRAPHS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
         <ChartBox title="Revenue by Service Type">
            <div className="h-[300px] mt-6">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart layout="vertical" data={data.serviceRevenueData}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} tick={{fontSize: 10, fontWeight: 700, fill: '#64748b'}} />
                      <Bar dataKey="value" fill="#6366F1" radius={[0, 8, 8, 0]} barSize={20} />
                      <RechartsTooltip cursor={{fill: 'transparent'}} />
                   </BarChart>
                </ResponsiveContainer>
            </div>
         </ChartBox>

         <ChartBox title="Client Status Distribution">
            <div className="h-[300px] flex flex-col items-center justify-center relative">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie data={data.healthData} innerRadius={80} outerRadius={110} paddingAngle={8} dataKey="value">
                        {data.healthData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                     </Pie>
                     <RechartsTooltip />
                  </PieChart>
               </ResponsiveContainer>
               <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-black text-slate-800">{data.activeClients}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active</span>
               </div>
            </div>
         </ChartBox>
      </div>

      {/* TREND & WORKLOAD ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-8">
         <div className="lg:col-span-3">
            <ChartBox title="Task Completion Trend (7 Days)">
               <div className="h-[320px] mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                     <LineChart data={data.trendData}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                        <RechartsTooltip />
                        <Line type="monotone" dataKey="completed" stroke="#10B981" strokeWidth={4} dot={{r: 4, fill: '#10B981'}} />
                        <Line type="monotone" dataKey="created" stroke="#6366F1" strokeWidth={4} dot={{r: 4, fill: '#6366F1'}} />
                     </LineChart>
                  </ResponsiveContainer>
               </div>
            </ChartBox>
         </div>
         <div className="lg:col-span-2">
            <ChartBox title="Team Workload (Open Tasks)">
               <div className="h-[320px] mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={data.workloadData}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} />
                        <Bar dataKey="tasks" fill="#818cf8" radius={[12, 12, 12, 12]} barSize={40} />
                        <RechartsTooltip />
                     </BarChart>
                  </ResponsiveContainer>
               </div>
            </ChartBox>
         </div>
      </div>

      {/* BOTTOM PROJECT GRID */}
      <ChartBox title="Project Status Overview">
         <div className="h-[280px] mt-8">
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={data.statusData}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11, fontWeight: 700}} />
                  <Bar dataKey="value" fill="#6366F1" radius={[8, 8, 0, 0]} barSize={80}>
                     {data.statusData.map((entry, index) => (
                        <Cell key={index} fill={entry.name === 'Completed' ? '#10B981' : entry.name === 'In Progress' ? '#3B82F6' : '#E2E8F0'} />
                     ))}
                  </Bar>
                  <RechartsTooltip />
               </BarChart>
            </ResponsiveContainer>
         </div>
      </ChartBox>
    </div>
  );
}

function TopStat({ title, val, sub, color }) {
  return (
    <div className="bg-white p-7 rounded-[28px] border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{title}</p>
       <h2 className={`text-4xl font-black tracking-tighter ${color}`}>{val}</h2>
       <div className="flex items-center gap-1.5 mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-tighter italic">
          {sub}
       </div>
    </div>
  );
}

function ChartBox({ title, children }) {
  return (
    <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm">
       <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest italic">{title}</h3>
          <BarChart3 className="text-slate-100" size={20} />
       </div>
       {children}
    </div>
  );
}