import { useState } from "react";
import { motion } from "motion/react";
import { BookOpen, Zap, Clock, Brain, ArrowRight, Loader2 } from "lucide-react";
import { StudentType } from "../types";
import { cn } from "../lib/utils";

interface OnboardingProps {
  onComplete: (studentType: StudentType, course: string) => void;
  error?: string | null;
}

const STUDENT_TYPES: { id: StudentType; title: string; desc: string; icon: any }[] = [
  {
    id: "topper",
    title: "Topper",
    desc: "Fast-paced, deep dive into advanced concepts and complex problems.",
    icon: Zap,
  },
  {
    id: "slow_learner",
    title: "Slow Learner",
    desc: "Gradual progression with simplified explanations and strong fundamentals.",
    icon: Brain,
  },
  {
    id: "one_day_learner",
    title: "One Day Learner",
    desc: "High-yield, exam-focused content covering only core concepts.",
    icon: Clock,
  },
];

export default function Onboarding({ onComplete, error }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [studentType, setStudentType] = useState<StudentType | null>(null);
  const [course, setCourse] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleComplete = async () => {
    if (studentType && course) {
      setIsGenerating(true);
      try {
        await onComplete(studentType, course);
      } finally {
        setIsGenerating(false);
      }
    }
  };

  return (
    <div id="onboarding-container" className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div id="onboarding-content" className="w-full max-w-2xl">
        <div className="mb-8 flex justify-between items-center">
          <div className="flex gap-2">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={cn(
                  "h-1.5 w-12 rounded-full transition-all duration-300",
                  step >= s ? "bg-brand-600" : "bg-slate-200"
                )}
              />
            ))}
          </div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Step {step} of 2
          </span>
        </div>

        {step === 1 ? (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900">How do you learn?</h2>
              <p className="text-slate-500 mt-2">Choose the style that fits you best</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {STUDENT_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setStudentType(type.id)}
                  className={cn(
                    "p-6 rounded-2xl border-2 text-left transition-all group",
                    studentType === type.id
                      ? "border-brand-600 bg-brand-50 ring-4 ring-brand-500/10"
                      : "border-white bg-white hover:border-slate-200"
                  )}
                >
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors",
                      studentType === type.id ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                    )}
                  >
                    <type.icon size={24} />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-1">{type.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{type.desc}</p>
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-4">
              <button
                disabled={!studentType}
                onClick={() => setStep(2)}
                className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-xl shadow-lg shadow-brand-500/20 transition-all flex items-center gap-2 group"
              >
                Next Step
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900">What are you studying?</h2>
              <p className="text-slate-500 mt-2">Enter the course or subject name</p>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm text-center">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">
                  Course Name
                </label>
                <div className="relative">
                  <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="text"
                    autoFocus
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    placeholder="e.g., Quantum Physics, React Development, History of Art"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-lg transition-all"
                  />
                </div>
              </div>

              <div className="mt-8 flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-4 font-semibold text-slate-500 hover:bg-slate-50 rounded-2xl transition-all"
                >
                  Back
                </button>
                <button
                  disabled={!course || isGenerating}
                  onClick={handleComplete}
                  className="flex-[2] bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold py-4 rounded-2xl shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Generating Roadmap...
                    </>
                  ) : (
                    <>
                      Start Learning
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
