import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Code2, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Sparkles,
  ChevronRight,
  Lightbulb,
  RefreshCw
} from "lucide-react";
import { CodingChallenge, EvaluationResult } from "../types";
import { geminiService } from "../services/gemini";
import { cn } from "../lib/utils";

interface CodingTestProps {
  course: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  onBack: () => void;
}

export default function CodingTest({ course, topic, difficulty, onBack }: CodingTestProps) {
  const [challenge, setChallenge] = useState<CodingChallenge | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);

  useEffect(() => {
    const fetchChallenge = async () => {
      setLoading(true);
      try {
        const data = await geminiService.generateCodingChallenge(course, topic, difficulty);
        setChallenge(data);
        setCode(data.starterCode || "");
      } catch (error) {
        console.error("Failed to fetch coding challenge:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChallenge();
  }, [course, topic, difficulty]);

  const handleEvaluate = async () => {
    if (!challenge || evaluating) return;
    setEvaluating(true);
    try {
      const evalResult = await geminiService.evaluateCode(
        challenge.problemStatement,
        code,
        challenge.language
      );
      setResult(evalResult);
    } catch (error) {
      console.error("Failed to evaluate code:", error);
    } finally {
      setEvaluating(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-brand-600 animate-spin" />
        <p className="text-slate-500 font-medium">Preparing coding challenge for {topic}...</p>
      </div>
    );
  }

  if (!challenge) return null;

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Column: Problem Description */}
      <div className="space-y-6">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-brand-100 text-brand-600 rounded-xl">
              <Code2 size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{challenge.title}</h2>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Language: {challenge.language}
                </span>
                <span className="text-slate-300">•</span>
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full",
                  difficulty === "easy" ? "bg-green-100 text-green-700" :
                  difficulty === "medium" ? "bg-blue-100 text-blue-700" :
                  "bg-purple-100 text-purple-700"
                )}>
                  {difficulty}
                </span>
              </div>
            </div>
          </div>

          <div className="prose prose-slate max-w-none mb-8">
            <p className="text-slate-600 leading-relaxed">
              {challenge.problemStatement}
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Examples</h4>
            {challenge.examples.map((ex, i) => (
              <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                <div className="flex gap-2">
                  <span className="text-xs font-bold text-slate-400 w-12">Input:</span>
                  <code className="text-xs text-brand-600 font-mono">{ex.input}</code>
                </div>
                <div className="flex gap-2">
                  <span className="text-xs font-bold text-slate-400 w-12">Output:</span>
                  <code className="text-xs text-slate-700 font-mono">{ex.output}</code>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 space-y-4">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Constraints</h4>
            <ul className="list-disc list-inside space-y-1">
              {challenge.constraints.map((c, i) => (
                <li key={i} className="text-xs text-slate-500">{c}</li>
              ))}
            </ul>
          </div>

          <div className="mt-8 p-6 bg-brand-50 rounded-2xl border border-brand-100">
            <div className="flex items-center gap-2 text-brand-600 font-bold text-xs uppercase tracking-widest mb-3">
              <Lightbulb size={14} />
              Study Tips for {topic}
            </div>
            <ul className="space-y-2">
              <li className="text-xs text-slate-600 flex gap-2">
                <div className="w-1 h-1 rounded-full bg-brand-400 mt-1.5 shrink-0" />
                Break the problem into smaller sub-tasks before writing any code.
              </li>
              <li className="text-xs text-slate-600 flex gap-2">
                <div className="w-1 h-1 rounded-full bg-brand-400 mt-1.5 shrink-0" />
                Think about edge cases (empty inputs, large numbers, etc.).
              </li>
              <li className="text-xs text-slate-600 flex gap-2">
                <div className="w-1 h-1 rounded-full bg-brand-400 mt-1.5 shrink-0" />
                Use descriptive variable names to make your code self-documenting.
              </li>
            </ul>
          </div>
        </div>

        <button
          onClick={onBack}
          className="text-sm font-bold text-slate-400 hover:text-slate-600 flex items-center gap-2 transition-colors"
        >
          Back to Assessments
        </button>
      </div>

      {/* Right Column: Code Editor & Result */}
      <div className="space-y-6">
        <div className="bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[600px]">
          <div className="px-6 py-3 bg-slate-800 flex items-center justify-between">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/20" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
              <div className="w-3 h-3 rounded-full bg-green-500/20" />
            </div>
            <span className="text-xs font-mono text-slate-400">editor.{challenge.language.toLowerCase()}</span>
          </div>
          
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1 w-full p-6 bg-slate-900 text-slate-300 font-mono text-sm focus:outline-none resize-none leading-relaxed"
            spellCheck={false}
          />

          <div className="p-4 bg-slate-800 flex justify-end">
            <button
              onClick={handleEvaluate}
              disabled={evaluating}
              className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-brand-500/20 transition-all flex items-center gap-2"
            >
              {evaluating ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Evaluating...
                </>
              ) : (
                <>
                  <Play size={18} />
                  Run & Evaluate
                </>
              )}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "p-8 rounded-3xl border-2 shadow-xl",
                result.correct ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
              )}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  {result.correct ? (
                    <div className="p-2 bg-green-500 text-white rounded-lg">
                      <CheckCircle2 size={24} />
                    </div>
                  ) : (
                    <div className="p-2 bg-red-500 text-white rounded-lg">
                      <XCircle size={24} />
                    </div>
                  )}
                  <div>
                    <h3 className={cn("font-bold text-xl", result.correct ? "text-green-900" : "text-red-900")}>
                      {result.correct ? "Accepted" : "Needs Work"}
                    </h3>
                    <p className={cn("text-sm font-bold", result.correct ? "text-green-600" : "text-red-600")}>
                      Score: {result.score}/100
                    </p>
                  </div>
                </div>
                <Sparkles className={cn(result.correct ? "text-green-400" : "text-red-400")} />
              </div>

              <p className={cn("text-sm leading-relaxed mb-6", result.correct ? "text-green-700" : "text-red-700")}>
                {result.feedback}
              </p>

              {result.suggestions.length > 0 && (
                <div className={cn("p-4 rounded-xl bg-white/50 space-y-2")}>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                    <Lightbulb size={14} />
                    Suggestions
                  </div>
                  <ul className="space-y-1">
                    {result.suggestions.map((s, i) => (
                      <li key={i} className="text-xs text-slate-600 flex gap-2">
                        <ChevronRight size={14} className="shrink-0 text-brand-500" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.correct && (
                <div className="mt-8 flex gap-3">
                  <button
                    onClick={() => {
                      setResult(null);
                      setLoading(true);
                      const fetchChallenge = async () => {
                        try {
                          const data = await geminiService.generateCodingChallenge(course, topic, difficulty);
                          setChallenge(data);
                          setCode(data.starterCode || "");
                        } catch (error) {
                          console.error("Failed to fetch coding challenge:", error);
                        } finally {
                          setLoading(false);
                        }
                      };
                      fetchChallenge();
                    }}
                    className="flex-1 bg-brand-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 group"
                  >
                    <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                    Try Another Challenge
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
