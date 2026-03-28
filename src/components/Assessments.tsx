import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Trophy, 
  Calendar, 
  GraduationCap, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  RefreshCw, 
  Loader2, 
  AlertCircle,
  Code2,
  Sparkles,
  Lightbulb,
  Play,
  ChevronRight,
  Clock,
  LayoutGrid,
  Shield
} from "lucide-react";
import { QuizQuestion, RoadmapItem, FinalExam, CodingChallenge, EvaluationResult } from "../types";
import { geminiService } from "../services/gemini";
import { cn } from "../lib/utils";

interface AssessmentsProps {
  course: string;
  roadmap: RoadmapItem[];
  progress: number;
  onViewTips: () => void;
}

type TestType = "weekly" | "final";

export default function Assessments({ course, roadmap, progress, onViewTips }: AssessmentsProps) {
  const [testType, setTestType] = useState<TestType | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [codingQuestions, setCodingQuestions] = useState<CodingChallenge[]>([]);
  const [currentSection, setCurrentSection] = useState<"quiz" | "coding">("quiz");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [codingScores, setCodingScores] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [currentCode, setCurrentCode] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  
  // Timer state (3 hours = 10800 seconds)
  const [timeLeft, setTimeLeft] = useState(10800);
  const [timerActive, setTimerActive] = useState(false);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const finishTest = useCallback(() => {
    setFinished(true);
    setTimerActive(false);
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timerActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            finishTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [timerActive, timeLeft, finishTest]);

  const startTest = async (type: TestType) => {
    setLoading(true);
    setError(null);
    setTestType(type);
    setCurrentSection("quiz");
    setTimeLeft(10800); // Reset to 3 hours

    try {
      if (type === "weekly") {
        const relevantTopics = roadmap
          .filter(item => item.status !== "todo")
          .map(item => item.title);
        
        const weeklyData: FinalExam = await geminiService.generateWeeklyTest(course, relevantTopics.length > 0 ? relevantTopics : [roadmap[0].title]);
        setQuestions(weeklyData.quizQuestions || []);
        setCodingQuestions(weeklyData.codingQuestions || []);
        setCodingScores(new Array(weeklyData.codingQuestions?.length || 0).fill(0));
      } else if (type === "final") {
        const allTopics = roadmap.map(item => item.title);
        const finalData: FinalExam = await geminiService.generateFinalExam(course, allTopics);
        setQuestions(finalData.quizQuestions || []);
        setCodingQuestions(finalData.codingQuestions || []);
        setCodingScores(new Array(finalData.codingQuestions?.length || 0).fill(0));
      }
      
      setCurrentIndex(0);
      setScore(0);
      setFinished(false);
      setIsAnswered(false);
      setSelectedAnswer(null);
      setEvaluationResult(null);
      setCurrentCode("");
      setTimerActive(true);
    } catch (err: any) {
      console.error("Failed to generate test:", err);
      setError(err.message || "Failed to generate test.");
    } finally {
      setLoading(false);
    }
  };

  const jumpToQuestion = (section: "quiz" | "coding", index: number) => {
    setCurrentSection(section);
    setCurrentIndex(index);
    if (section === "quiz") {
      setIsAnswered(false); // In a real app, we'd save answers. For now, we reset if they jump back to an unanswered one.
      setSelectedAnswer(null);
    } else {
      setCurrentCode(codingQuestions[index].starterCode || "");
      setEvaluationResult(null);
    }
  };

  const handleAnswer = (index: number) => {
    if (isAnswered) return;
    setSelectedAnswer(index);
    setIsAnswered(true);
    if (index === questions[currentIndex].correctAnswer) {
      // Quiz questions are 0.5 marks each for final exam
      const mark = testType === "final" ? 0.5 : 1;
      setScore(prev => prev + mark);
    }
  };

  const nextQuestion = () => {
    if (currentSection === "quiz") {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setIsAnswered(false);
        setSelectedAnswer(null);
      } else if (codingQuestions.length > 0) {
        setCurrentSection("coding");
        setCurrentIndex(0);
        setCurrentCode(codingQuestions[0].starterCode || "");
        setEvaluationResult(null);
      } else {
        setFinished(true);
      }
    } else {
      if (currentIndex < codingQuestions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setCurrentCode(codingQuestions[currentIndex + 1].starterCode || "");
        setEvaluationResult(null);
      } else {
        setFinished(true);
      }
    }
  };

  const handleEvaluateCode = async () => {
    if (evaluating) return;
    setEvaluating(true);
    try {
      const challenge = codingQuestions[currentIndex];
      const result = await geminiService.evaluateCode(
        challenge.problemStatement,
        currentCode,
        challenge.language
      );
      setEvaluationResult(result);
      
      // Update coding scores
      const newScores = [...codingScores];
      newScores[currentIndex] = result.score;
      setCodingScores(newScores);
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
        <p className="text-slate-500 font-medium">
          Preparing your {testType === "weekly" ? "Weekly Assignment" : "Final Exam"}...
        </p>
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
          <h2 className="text-xl font-bold text-slate-900 mb-2">Assessment Error</h2>
          <p className="text-slate-500">{error}</p>
        </div>
        <button 
          onClick={() => setTestType(null)}
          className="px-6 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-all"
        >
          Back to Assessments
        </button>
      </div>
    );
  }

  if (!testType) {
    return (
      <div className="space-y-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-slate-900">Assessments</h2>
          <p className="text-slate-500 mt-2">Test your knowledge with comprehensive assignments</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Weekly Assignment Card */}
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 flex flex-col">
            <div className="w-14 h-14 bg-brand-100 text-brand-600 rounded-2xl flex items-center justify-center mb-6">
              <Calendar size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Weekly Assignment</h3>
            <p className="text-slate-500 text-sm mb-8 flex-1">
              10 Quiz questions + 8 Coding challenges (for coding courses) covering your current progress.
            </p>
            <button
              onClick={() => startTest("weekly")}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2"
            >
              Start Assignment
              <ArrowRight size={18} />
            </button>
          </div>

          {/* Final Exam Card */}
          <div className={cn(
            "p-8 rounded-3xl shadow-xl border flex flex-col relative overflow-hidden",
            progress === 100 
              ? "bg-white border-brand-500 ring-2 ring-brand-500/20" 
              : "bg-slate-50 border-slate-200 opacity-80"
          )}>
            <div className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center mb-6",
              progress === 100 ? "bg-brand-600 text-white" : "bg-slate-200 text-slate-400"
            )}>
              <GraduationCap size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Final Course Exam</h3>
            <p className="text-slate-500 text-sm mb-8 flex-1">
              Comprehensive exam: 20 Quiz questions (0.5 marks each) + 9 Coding questions.
            </p>
            
            {progress < 100 ? (
              <div className="flex items-center gap-2 text-slate-400 text-sm font-bold bg-slate-100 p-4 rounded-xl">
                <AlertCircle size={18} />
                Complete all modules to unlock ({progress}%)
              </div>
            ) : (
              <button
                onClick={() => startTest("final")}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2"
              >
                Start Final Exam
                <Trophy size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Learning Tips Section */}
        <div className="mt-12 p-8 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
                <Lightbulb size={20} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Pro Learning Tips</h3>
            </div>
            <button 
              onClick={onViewTips}
              className="text-sm font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors"
            >
              View Full Guide
              <ArrowRight size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 text-sm">Active Recall</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Don't just read. Close the book and try to explain the concept in your own words.</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 text-sm">Spaced Repetition</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Review topics at increasing intervals (1 day, 3 days, 1 week) to move them to long-term memory.</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 text-sm">Feynman Technique</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Explain a topic to a "five-year-old". If you can't simplify it, you don't understand it yet.</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 text-sm">Build to Learn</h4>
              <p className="text-xs text-slate-500 leading-relaxed">The best way to learn coding is to build projects. Use our coding challenges to practice daily.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (finished) {
    const totalQuizScore = score;
    // Coding score is normalized to 1 mark per question
    const totalCodingScore = codingScores.reduce((a, b) => a + b, 0) / 100; 
    
    const finalScore = totalQuizScore + totalCodingScore;
    const maxScore = questions.length + codingQuestions.length;
    const percentage = Math.round((finalScore / maxScore) * 100);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto text-center py-12"
      >
        <div className="w-24 h-24 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Trophy size={48} />
        </div>
        <h2 className="text-3xl font-bold text-slate-900">
          {testType === "weekly" ? "Assignment Completed!" : "Final Exam Completed!"}
        </h2>
        <p className="text-slate-500 mt-2 mb-4">
          Final Score: <span className="text-brand-600 font-bold">{finalScore.toFixed(1)}</span> / {maxScore}
        </p>
        
        <div className="bg-slate-50 p-6 rounded-2xl mb-8">
          <div className="text-4xl font-black text-brand-600 mb-1">{percentage}%</div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {percentage >= 80 ? "Excellent Performance!" : percentage >= 60 ? "Good Job!" : "Keep Practicing!"}
          </div>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={() => startTest(testType)}
            className="w-full bg-brand-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2"
          >
            <RefreshCw size={20} />
            Retake Test
          </button>
          <button
            onClick={() => setTestType(null)}
            className="w-full bg-slate-100 text-slate-600 font-bold py-4 rounded-2xl"
          >
            Back to Assessments
          </button>
        </div>
      </motion.div>
    );
  }

  if (currentSection === "quiz") {
    const currentQuestion = questions[currentIndex];
    return (
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Sidebar: Navigation & Timer */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100">
            <div className="flex items-center gap-3 mb-6 text-brand-600">
              <Clock size={24} />
              <div className="text-2xl font-black font-mono">{formatTime(timeLeft)}</div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                <LayoutGrid size={14} />
                Question Navigation
              </div>
              
              <div className="grid grid-cols-5 gap-2">
                {questions.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => jumpToQuestion("quiz", i)}
                    className={cn(
                      "h-10 w-10 rounded-xl font-bold text-sm transition-all",
                      i === currentIndex 
                        ? "bg-brand-600 text-white shadow-lg shadow-brand-500/20" 
                        : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              {codingQuestions.length > 0 && (
                <>
                  <div className="pt-4 border-t border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Coding Section</div>
                    <div className="grid grid-cols-5 gap-2">
                      {codingQuestions.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => jumpToQuestion("coding", i)}
                          className="h-10 w-10 rounded-xl font-bold text-sm bg-slate-50 text-slate-400 hover:bg-slate-100"
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={finishTest}
              className="w-full mt-8 bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-all text-sm"
            >
              Submit Test
            </button>
          </div>
        </div>

        {/* Main Content: Quiz Question */}
        <div className="lg:col-span-3">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900 capitalize">Section 1: Quiz</h2>
              <p className="text-xs text-slate-500">Question {currentIndex + 1} of {questions.length}</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 mb-8 leading-tight">
              {currentQuestion.question}
            </h3>

            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const isCorrect = index === currentQuestion.correctAnswer;
                const isSelected = index === selectedAnswer;
                
                return (
                  <button
                    key={index}
                    disabled={isAnswered}
                    onClick={() => handleAnswer(index)}
                    className={cn(
                      "w-full p-4 rounded-xl border-2 text-left font-medium transition-all flex items-center justify-between",
                      !isAnswered
                        ? "border-slate-100 hover:border-brand-500 hover:bg-brand-50/30"
                        : isCorrect
                        ? "border-green-500 bg-green-50 text-green-700"
                        : isSelected
                        ? "border-red-500 bg-red-50 text-red-700"
                        : "border-slate-50 opacity-50"
                    )}
                  >
                    <span>{option}</span>
                    {isAnswered && (
                      isCorrect ? <CheckCircle2 size={20} /> : isSelected ? <XCircle size={20} /> : null
                    )}
                  </button>
                );
              })}
            </div>

            <AnimatePresence>
              {isAnswered && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 pt-6 border-t border-slate-100"
                >
                  <div className="bg-slate-50 p-4 rounded-xl mb-6">
                    <p className="text-sm font-bold text-slate-900 mb-1">Explanation</p>
                    <p className="text-sm text-slate-600 leading-relaxed">{currentQuestion.explanation}</p>
                  </div>
                  <button
                    onClick={nextQuestion}
                    className="w-full bg-brand-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 group"
                  >
                    {currentIndex === questions.length - 1 && codingQuestions.length > 0 
                      ? "Proceed to Coding Section" 
                      : currentIndex === questions.length - 1 
                      ? "Finish Test" 
                      : "Next Question"}
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  }

  // Coding Section
  const currentChallenge = codingQuestions[currentIndex];
  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Left Sidebar: Navigation & Timer */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100">
          <div className="flex items-center gap-3 mb-6 text-brand-600">
            <Clock size={24} />
            <div className="text-2xl font-black font-mono">{formatTime(timeLeft)}</div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <LayoutGrid size={14} />
              Question Navigation
            </div>
            
            <div className="grid grid-cols-5 gap-2">
              {questions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => jumpToQuestion("quiz", i)}
                  className="h-10 w-10 rounded-xl font-bold text-sm bg-slate-50 text-slate-400 hover:bg-slate-100"
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Coding Section</div>
              <div className="grid grid-cols-5 gap-2">
                {codingQuestions.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => jumpToQuestion("coding", i)}
                    className={cn(
                      "h-10 w-10 rounded-xl font-bold text-sm transition-all",
                      i === currentIndex 
                        ? "bg-brand-600 text-white shadow-lg shadow-brand-500/20" 
                        : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={finishTest}
            className="w-full mt-8 bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-all text-sm"
          >
            Submit Test
          </button>
        </div>
      </div>

      {/* Main Content: Coding Challenge */}
      <div className="lg:col-span-3 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Section 2: Coding</h2>
            <p className="text-sm text-slate-500">Challenge {currentIndex + 1} of {codingQuestions.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Problem Description */}
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-brand-100 text-brand-600 rounded-xl">
                <Code2 size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">{currentChallenge.title}</h3>
            </div>
            
            <p className="text-slate-600 leading-relaxed">{currentChallenge.problemStatement}</p>

            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Examples</h4>
              {currentChallenge.examples.map((ex, i) => (
                <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                  <div className="text-xs font-mono"><span className="text-slate-400">Input:</span> {ex.input}</div>
                  <div className="text-xs font-mono"><span className="text-slate-400">Output:</span> {ex.output}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Editor */}
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[500px]">
              <div className="px-6 py-3 bg-slate-800 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">editor.{currentChallenge.language.toLowerCase()}</span>
              </div>
              <textarea
                value={currentCode}
                onChange={(e) => setCurrentCode(e.target.value)}
                className="flex-1 w-full p-6 bg-slate-900 text-slate-300 font-mono text-sm focus:outline-none resize-none leading-relaxed"
                spellCheck={false}
              />
              <div className="p-4 bg-slate-800 flex justify-end">
                <button
                  onClick={handleEvaluateCode}
                  disabled={evaluating}
                  className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition-all flex items-center gap-2"
                >
                  {evaluating ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
                  Run & Evaluate
                </button>
              </div>
            </div>

            {evaluationResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "p-6 rounded-2xl border-2",
                  evaluationResult.correct ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                )}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {evaluationResult.correct ? <CheckCircle2 className="text-green-600" /> : <XCircle className="text-red-600" />}
                    <span className="font-bold text-slate-900">Score: {evaluationResult.score}/100</span>
                  </div>
                  <button
                    onClick={nextQuestion}
                    className="bg-brand-600 text-white font-bold px-6 py-2 rounded-xl flex items-center gap-2"
                  >
                    {currentIndex === codingQuestions.length - 1 ? "Finish Exam" : "Next Challenge"}
                    <ArrowRight size={18} />
                  </button>
                </div>
                <p className="text-sm text-slate-600">{evaluationResult.feedback}</p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
