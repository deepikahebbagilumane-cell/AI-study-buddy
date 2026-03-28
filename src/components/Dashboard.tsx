import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  LayoutDashboard, 
  Map, 
  Target, 
  MessageSquare, 
  LogOut, 
  ChevronRight,
  CheckCircle2,
  Circle,
  Trophy,
  HelpCircle,
  Lightbulb,
  Shield
} from "lucide-react";
import { User, RoadmapItem, DailyChallenge } from "../types";
import { geminiService } from "../services/gemini";
import Roadmap from "./Roadmap";
import DailyChallenges from "./DailyChallenges";
import AIAssistant from "./AIAssistant";
import Quiz from "./Quiz";
import Assessments from "./Assessments";
import LearningTips from "./LearningTips";
import AdminPanel from "./AdminPanel";
import { cn } from "../lib/utils";

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<"roadmap" | "challenges" | "chat" | "quiz" | "assessments" | "tips" | "admin">("roadmap");
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminError, setAdminError] = useState(false);
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>([]);
  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      setError(null);
      try {
        const STORAGE_KEY = 'study_buddy_user';
        const savedUser = localStorage.getItem(STORAGE_KEY);
        const userData = savedUser ? JSON.parse(savedUser) : {};

        // Load roadmap
        let currentRoadmap: RoadmapItem[] = user.roadmap || [];
        if (currentRoadmap.length === 0) {
          currentRoadmap = await geminiService.generateRoadmap(user.course!, user.studentType!);
          
          // Save to backend
          const response = await fetch('/api/user/roadmap', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id || user._id, roadmap: currentRoadmap })
          });
          
          if (response.ok) {
            const data = await response.json();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
          }
          
          // Add a small delay to avoid hitting rate limits for the next call
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
        setRoadmap(currentRoadmap);

        // Load challenges
        let currentChallenges: DailyChallenge[] = user.challenges || [];
        if (currentChallenges.length === 0) {
          const newChallenges = await geminiService.generateDailyChallenges(
            user.course!, 
            user.studentType!, 
            currentRoadmap.slice(0, 2).map(r => r.title)
          );
          currentChallenges = newChallenges.map((task: string, i: number) => ({
            id: `c-${i}`,
            task,
            completed: false
          }));

          // Save to backend
          const response = await fetch('/api/user/challenges', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id || user._id, challenges: currentChallenges })
          });

          if (response.ok) {
            const data = await response.json();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
          }
        }
        setChallenges(currentChallenges);
      } catch (err: any) {
        console.error("Failed to initialize dashboard:", err);
        setError(err.message || "Failed to load dashboard data. Please check your connection or API key.");
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [user.id, user.course, user.studentType]);

  useEffect(() => {
    if (roadmap.length > 0) {
      const completed = roadmap.filter(r => r.status === "completed").length;
      setProgress(Math.round((completed / roadmap.length) * 100));
    }
  }, [roadmap]);

  const updateRoadmapStatus = async (id: string, status: RoadmapItem["status"]) => {
    const updated = roadmap.map(item => item.id === id ? { ...item, status } : item);
    setRoadmap(updated);
    
    // Save to backend
    const response = await fetch('/api/user/roadmap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id || user._id, roadmap: updated })
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('study_buddy_user', JSON.stringify(data.user));
    }
  };

  const toggleChallenge = async (id: string) => {
    const updated = challenges.map(c => c.id === id ? { ...c, completed: !c.completed } : c);
    setChallenges(updated);
    
    // Save to backend
    const response = await fetch('/api/user/challenges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id || user._id, challenges: updated })
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('study_buddy_user', JSON.stringify(data.user));
    }
  };

  const tabs = [
    { id: "roadmap", label: "Roadmap", icon: Map },
    { id: "challenges", label: "Challenges", icon: Target },
    { id: "tips", label: "Study Guide", icon: Lightbulb },
    { id: "quiz", label: "Quiz", icon: HelpCircle },
    { id: "assessments", label: "Assessments", icon: Trophy },
    { id: "chat", label: "AI Tutor", icon: MessageSquare },
    ...(user.role === 'admin' ? [{ id: "admin", label: "Admin Panel", icon: Shield }] : []),
  ];

  const handleTabChange = (tabId: any) => {
    if (tabId === "admin" && !isAdminUnlocked) {
      setActiveTab("admin");
      return;
    }
    setActiveTab(tabId);
  };

  const handleAdminUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Try standard Vite environment variable
    const envSecret = import.meta.env.VITE_ADMIN_ACCESS_PASSWORD;
    
    // 2. Try process.env (configured in vite.config.ts)
    const processSecret = typeof process !== 'undefined' ? (process.env as any)?.VITE_ADMIN_ACCESS_PASSWORD : undefined;
    
    // 3. Fallback to default
    const secret = envSecret || processSecret || "admin123";
    
    if (adminPassword.trim() === secret.trim()) {
      setIsAdminUnlocked(true);
      setAdminError(false);
    } else {
      setAdminError(true);
      console.warn("Admin access denied. If you are in VS Code, ensure you have a .env file with VITE_ADMIN_ACCESS_PASSWORD=your_password and have restarted your server.");
    }
  };

  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setIsDemoMode(data.mode === 'demo'))
      .catch(() => {});
  }, []);

  return (
    <div id="dashboard-container" className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside id="sidebar" className="w-full md:w-64 bg-white border-r border-slate-200 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
            <Trophy size={20} />
          </div>
          <span className="font-bold text-xl tracking-tight">StudyBuddy</span>
        </div>

        {isDemoMode && (
          <div className="mb-6 p-3 bg-amber-50 border border-amber-100 rounded-xl">
            <div className="flex items-center gap-2 text-amber-700 text-[10px] font-bold uppercase tracking-wider">
              <Shield size={12} />
              Demo Mode
            </div>
            <p className="text-[10px] text-amber-600 mt-1 leading-tight">
              Database not connected. Data will reset on server restart.
            </p>
          </div>
        )}

        <nav className="flex-1 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all",
                activeTab === tab.id
                  ? "bg-brand-50 text-brand-600 shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <tab.icon size={20} />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-6 p-2">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold uppercase">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                {user.role === 'admin' && (
                  <span className="px-1.5 py-0.5 rounded bg-brand-100 text-brand-700 text-[10px] font-bold uppercase tracking-wider">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 truncate capitalize">{user.studentType?.replace("_", " ")}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Welcome back, {user.name.split(" ")[0]}!</h1>
            <p className="text-slate-500 mt-1">You're making great progress on <span className="text-brand-600 font-semibold">{user.course}</span></p>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 min-w-[240px]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall Progress</span>
              <span className="text-sm font-bold text-brand-600">{progress}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-brand-600"
              />
            </div>
            {progress === 100 && (
              <button 
                onClick={() => setActiveTab("assessments")}
                className="w-full mt-2 py-2 bg-brand-600 text-white text-xs font-bold rounded-lg hover:bg-brand-700 transition-all flex items-center justify-center gap-2"
              >
                <Trophy size={14} />
                Take Final Exam
              </button>
            )}
          </div>
        </header>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-[60vh] flex flex-col items-center justify-center gap-4"
            >
              <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
              <p className="text-slate-500 font-medium">Preparing your study session...</p>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-[60vh] flex flex-col items-center justify-center gap-6 text-center max-w-md mx-auto"
            >
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <Shield size={32} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Initialization Error</h2>
                <p className="text-slate-500">{error}</p>
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-all"
              >
                Try Again
              </button>
              <p className="text-xs text-slate-400">
                If the problem persists, please check your <b>GEMINI_API_KEY</b> in the application settings.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "roadmap" && (
                <Roadmap roadmap={roadmap} onUpdateStatus={updateRoadmapStatus} />
              )}
              {activeTab === "challenges" && (
                <DailyChallenges challenges={challenges} onToggle={toggleChallenge} />
              )}
              {activeTab === "quiz" && (
                <Quiz course={user.course!} roadmap={roadmap} />
              )}
              {activeTab === "assessments" && (
                <Assessments 
                  course={user.course!} 
                  roadmap={roadmap} 
                  progress={progress} 
                  onViewTips={() => setActiveTab("tips")}
                />
              )}
              {activeTab === "tips" && (
                <LearningTips course={user.course!} studentType={user.studentType!} />
              )}
              {activeTab === "chat" && (
                <AIAssistant user={user} />
              )}
              {activeTab === "admin" && (
                isAdminUnlocked ? (
                  <AdminPanel />
                ) : (
                  <div className="h-[60vh] flex flex-col items-center justify-center">
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 max-w-sm w-full text-center"
                    >
                      <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Shield size={32} />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900 mb-2">Admin Access</h2>
                      <p className="text-slate-500 mb-8 text-sm">Please enter the administrator password to access the control panel.</p>
                      
                      <form onSubmit={handleAdminUnlock} className="space-y-4">
                        <div className="relative">
                          <input
                            type={showAdminPassword ? "text" : "password"}
                            value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                            placeholder="Enter password"
                            className={cn(
                              "w-full px-4 py-3 pr-12 rounded-xl border bg-slate-50 focus:outline-none focus:ring-2 transition-all",
                              adminError 
                                ? "border-red-300 focus:ring-red-100" 
                                : "border-slate-200 focus:ring-brand-100 focus:border-brand-300"
                            )}
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => setShowAdminPassword(!showAdminPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            {showAdminPassword ? <Circle size={18} /> : <Target size={18} />}
                          </button>
                          {adminError && (
                            <p className="text-red-500 text-xs font-bold mt-2 text-left">Incorrect password. Please try again.</p>
                          )}
                        </div>
                        <button
                          type="submit"
                          className="w-full py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20"
                        >
                          Unlock Panel
                        </button>
                        <p className="text-[10px] text-slate-400 mt-4">
                          Hint: The default password is <b>admin123</b>. You can change this in your <b>.env</b> file or the application settings.
                        </p>
                      </form>
                    </motion.div>
                  </div>
                )
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
