import { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { 
  Users, 
  Mail, 
  GraduationCap, 
  Calendar, 
  ShieldCheck, 
  Shield, 
  TrendingUp, 
  BookOpen, 
  Brain,
  BarChart3,
  PieChart as PieChartIcon,
  Activity
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { cn } from "../lib/utils";

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AdminPanel() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dbStatus, setDbStatus] = useState<'connected' | 'demo' | 'error'>('demo');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('study_buddy_token')}`
        }
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setUsers(data.users || []);
      
      // Also check health for DB status
      const healthRes = await fetch('/api/health');
      const healthData = await healthRes.json();
      setDbStatus(healthData.mode === 'mongodb' ? 'connected' : 'demo');
    } catch (err: any) {
      setError(err.message);
      setDbStatus('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const stats = useMemo(() => {
    if (users.length === 0) return null;

    const onboarded = users.filter(u => u.onboarded).length;
    const learningStyles = users.reduce((acc: any, u) => {
      if (u.studentType) {
        const style = u.studentType.replace("_", " ");
        acc[style] = (acc[style] || 0) + 1;
      }
      return acc;
    }, {});

    const courses = users.reduce((acc: any, u) => {
      if (u.course) {
        acc[u.course] = (acc[u.course] || 0) + 1;
      }
      return acc;
    }, {});

    const totalProgress = users.reduce((acc, u) => {
      if (u.roadmap && u.roadmap.length > 0) {
        const completed = u.roadmap.filter((r: any) => r.status === "completed").length;
        return acc + (completed / u.roadmap.length);
      }
      return acc;
    }, 0);

    const avgProgress = onboarded > 0 ? Math.round((totalProgress / onboarded) * 100) : 0;

    const learningStyleData = Object.entries(learningStyles).map(([name, value]) => ({ name, value }));
    const courseData = Object.entries(courses).map(([name, value]) => ({ name, value }));

    return {
      onboarded,
      avgProgress,
      learningStyleData: learningStyleData.length > 0 ? learningStyleData : [{ name: 'No Data', value: 0 }],
      courseData: courseData.length > 0 ? courseData : [{ name: 'No Data', value: 0 }]
    };
  }, [users]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100">
        <p className="font-bold">Error loading admin data</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Admin Control Panel</h2>
          <p className="text-slate-500">Manage users and monitor application activity</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchUsers}
            className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm hover:bg-slate-50 transition-all"
          >
            <Activity size={18} />
            Refresh Data
          </button>
          
          {dbStatus === 'connected' ? (
            <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm">
              <ShieldCheck size={18} />
              Database Connected
            </div>
          ) : dbStatus === 'demo' ? (
            <div className="bg-amber-50 text-amber-600 px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm">
              <Shield size={18} />
              Demo Mode (No DB)
            </div>
          ) : (
            <div className="bg-red-50 text-red-600 px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm">
              <Shield size={18} />
              Connection Error
            </div>
          )}
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total Users</p>
              <p className="text-2xl font-bold text-slate-900">{users.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <GraduationCap size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Onboarded</p>
              <p className="text-2xl font-bold text-slate-900">{stats?.onboarded}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Avg. Progress</p>
              <p className="text-2xl font-bold text-slate-900">{stats?.avgProgress}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Shield size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Admins</p>
              <p className="text-2xl font-bold text-slate-900">
                {users.filter(u => u.role === 'admin').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Learning Styles Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 size={20} className="text-brand-600" />
            <h3 className="font-bold text-slate-900">Learning Styles Distribution</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.learningStyleData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Courses Pie Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <PieChartIcon size={20} className="text-brand-600" />
            <h3 className="font-bold text-slate-900">Popular Courses</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.courseData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats?.courseData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed User Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={20} className="text-brand-600" />
            <h3 className="font-bold text-slate-900">User Activity & Progress</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">User</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Learning Profile</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Progress</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => {
                const roadmapLength = user.roadmap?.length || 0;
                const completedCount = user.roadmap?.filter((r: any) => r.status === "completed").length || 0;
                const userProgress = roadmapLength > 0 ? Math.round((completedCount / roadmapLength) * 100) : 0;
                const userId = user._id || user.id;

                return (
                  <tr key={userId} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm">
                          {user.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{user.name || 'Unknown'}</p>
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            <Mail size={12} />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                          <Brain size={12} className="text-brand-500" />
                          <span className="capitalize">{user.studentType?.replace("_", " ") || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                          <BookOpen size={12} className="text-brand-500" />
                          <span>{user.course || "N/A"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="w-32">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-bold text-slate-400">{userProgress}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-brand-600 transition-all duration-500" 
                            style={{ width: `${userProgress}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        "px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
                        user.role === 'admin' 
                          ? 'bg-brand-100 text-brand-700' 
                          : user.onboarded 
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                      )}>
                        {user.role === 'admin' ? 'Admin' : user.onboarded ? 'Active' : 'Pending'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Calendar size={12} />
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
