import { motion } from "motion/react";
import { CheckCircle2, Circle, Target, Sparkles } from "lucide-react";
import { DailyChallenge } from "../types";
import { cn } from "../lib/utils";

interface DailyChallengesProps {
  challenges: DailyChallenge[];
  onToggle: (id: string) => void;
}

export default function DailyChallenges({ challenges, onToggle }: DailyChallengesProps) {
  const completedCount = challenges.filter(c => c.completed).length;

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-3xl p-8 text-white shadow-xl shadow-brand-500/20 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={20} className="text-brand-200" />
            <span className="text-sm font-bold text-brand-100 uppercase tracking-widest">Daily Quest</span>
          </div>
          <h2 className="text-3xl font-bold mb-4">Complete your daily challenges</h2>
          <p className="text-brand-100 max-w-md">
            Stay consistent! Completing daily challenges helps you retain information 40% better.
          </p>
          
          <div className="mt-8 flex items-center gap-4">
            <div className="flex-1 h-3 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(completedCount / challenges.length) * 100}%` }}
                className="h-full bg-white"
              />
            </div>
            <span className="font-bold">{completedCount}/{challenges.length} Done</span>
          </div>
        </div>
        
        <Target className="absolute -right-10 -bottom-10 w-64 h-64 text-white/10 rotate-12" />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {challenges.map((challenge, index) => (
          <motion.button
            key={challenge.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onToggle(challenge.id)}
            className={cn(
              "flex items-center gap-4 p-6 rounded-2xl border-2 text-left transition-all",
              challenge.completed
                ? "bg-slate-50 border-slate-100 opacity-75"
                : "bg-white border-white hover:border-brand-500 shadow-sm"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
              challenge.completed ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-400"
            )}>
              <CheckCircle2 size={20} />
            </div>
            <span className={cn(
              "flex-1 font-semibold text-lg",
              challenge.completed ? "text-slate-400 line-through" : "text-slate-900"
            )}>
              {challenge.task}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Consistency Tip */}
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-brand-100 text-brand-600 rounded-lg">
            <Sparkles size={20} />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Consistency is Key</h3>
        </div>
        <p className="text-sm text-slate-500 leading-relaxed mb-6">
          Learning is a marathon, not a sprint. Small daily efforts lead to massive long-term results. 
          Try to complete at least one challenge every single day to maintain your momentum!
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-1">Morning Routine</h4>
            <p className="text-xs text-slate-500">Check your challenges first thing in the morning to set your daily goal.</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-1">Evening Review</h4>
            <p className="text-xs text-slate-500">Spend 5 minutes before bed reviewing what you learned today.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
