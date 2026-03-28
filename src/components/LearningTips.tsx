import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Book, 
  Video, 
  Brain, 
  Clock, 
  Users, 
  Zap, 
  Loader2, 
  Sparkles,
  Lightbulb,
  ArrowRight,
  Shield
} from "lucide-react";
import { geminiService } from "../services/gemini";
import { StudentType } from "../types";
import { cn } from "../lib/utils";

interface LearningTipsProps {
  course: string;
  studentType: StudentType;
}

interface Suggestion {
  title: string;
  description: string;
  icon: string;
}

const iconMap: Record<string, any> = {
  book: Book,
  video: Video,
  brain: Brain,
  clock: Clock,
  users: Users,
  zap: Zap,
};

export default function LearningTips({ course, studentType }: LearningTipsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await geminiService.generateLearningSuggestions(course, studentType);
        setSuggestions(data);
      } catch (err: any) {
        console.error("Failed to fetch learning suggestions:", err);
        setError(err.message || "Failed to load suggestions.");
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [course, studentType]);

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-brand-600 animate-spin" />
        <p className="text-slate-500 font-medium">Generating personalized study tips...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-6 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-600">
          <Shield size={32} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Error Loading Tips</h2>
          <p className="text-slate-500">{error}</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center mb-10">
        <div className="inline-flex p-4 bg-yellow-100 text-yellow-600 rounded-2xl mb-4">
          <Lightbulb size={32} />
        </div>
        <h2 className="text-3xl font-bold text-slate-900">Study Guide & Tips</h2>
        <p className="text-slate-500 mt-2">Personalized strategies for your learning style: <span className="text-brand-600 font-bold capitalize">{studentType.replace("_", " ")}</span></p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {suggestions.map((suggestion, index) => {
          const Icon = iconMap[suggestion.icon] || Sparkles;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all group"
            >
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                  <Icon size={24} />
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">{suggestion.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {suggestion.description}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="bg-brand-600 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
            <Zap size={20} />
            Quick Learning Hack
          </h3>
          <p className="text-brand-100 text-sm mb-6 max-w-xl">
            Try the "Pomodoro Technique": Study for 25 minutes, then take a 5-minute break. It keeps your brain fresh and focused!
          </p>
          <div className="flex gap-4">
            <div className="bg-white/10 px-4 py-2 rounded-xl text-xs font-bold">25m Study</div>
            <div className="bg-white/10 px-4 py-2 rounded-xl text-xs font-bold">5m Break</div>
          </div>
        </div>
        <Sparkles size={120} className="absolute -right-10 -bottom-10 text-white/10" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
          <h4 className="font-bold text-slate-800 text-sm mb-2">Active Recall</h4>
          <p className="text-xs text-slate-500 leading-relaxed">Test yourself frequently. It's much more effective than re-reading notes.</p>
        </div>
        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
          <h4 className="font-bold text-slate-800 text-sm mb-2">Spaced Repetition</h4>
          <p className="text-xs text-slate-500 leading-relaxed">Review concepts after 1 day, 3 days, and 1 week to lock them in.</p>
        </div>
        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
          <h4 className="font-bold text-slate-800 text-sm mb-2">Sleep is Key</h4>
          <p className="text-xs text-slate-500 leading-relaxed">Your brain consolidates learning while you sleep. Don't skip it!</p>
        </div>
      </div>
    </div>
  );
}
