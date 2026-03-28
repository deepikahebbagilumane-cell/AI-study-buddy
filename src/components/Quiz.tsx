import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { HelpCircle, CheckCircle2, XCircle, ArrowRight, RefreshCw, Loader2, Trophy, Shield } from "lucide-react";
import { QuizQuestion, RoadmapItem } from "../types";
import { geminiService } from "../services/gemini";
import { cn } from "../lib/utils";

interface QuizProps {
  course: string;
  roadmap: RoadmapItem[];
}

export default function Quiz({ course, roadmap }: QuizProps) {
  const [topic, setTopic] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  const startQuiz = async (selectedTopic: string) => {
    setLoading(true);
    setError(null);
    setTopic(selectedTopic);
    try {
      const quizQuestions = await geminiService.generateQuiz(course, selectedTopic);
      setQuestions(quizQuestions);
      setCurrentIndex(0);
      setScore(0);
      setFinished(false);
      setIsAnswered(false);
      setSelectedAnswer(null);
    } catch (err: any) {
      console.error("Failed to generate quiz:", err);
      setError(err.message || "Failed to generate quiz.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (index: number) => {
    if (isAnswered) return;
    setSelectedAnswer(index);
    setIsAnswered(true);
    if (index === questions[currentIndex].correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsAnswered(false);
      setSelectedAnswer(null);
    } else {
      setFinished(true);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-brand-600 animate-spin" />
        <p className="text-slate-500 font-medium">Generating your quiz on {topic}...</p>
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
          <h2 className="text-xl font-bold text-slate-900 mb-2">Quiz Error</h2>
          <p className="text-slate-500">{error}</p>
        </div>
        <button 
          onClick={() => setTopic(null)}
          className="px-6 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-all"
        >
          Back to Topics
        </button>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-10">
          <div className="inline-flex p-4 bg-brand-100 text-brand-600 rounded-2xl mb-4">
            <HelpCircle size={32} />
          </div>
          <h2 className="text-3xl font-bold text-slate-900">Test your knowledge</h2>
          <p className="text-slate-500 mt-2">Pick a topic from your roadmap to start a quiz</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roadmap.map((item) => (
            <button
              key={item.id}
              onClick={() => startQuiz(item.title)}
              className="p-6 bg-white border border-slate-100 rounded-2xl text-left hover:border-brand-500 hover:shadow-md transition-all group"
            >
              <h3 className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">{item.title}</h3>
              <p className="text-xs text-slate-500 mt-1">{item.topics.length} concepts to cover</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (finished) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto text-center py-12"
      >
        <div className="w-24 h-24 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Trophy size={48} />
        </div>
        <h2 className="text-3xl font-bold text-slate-900">Quiz Completed!</h2>
        <p className="text-slate-500 mt-2 mb-8">
          You scored <span className="text-brand-600 font-bold">{score}</span> out of {questions.length}
        </p>
        
        <div className="space-y-3">
          <button
            onClick={() => startQuiz(topic)}
            className="w-full bg-brand-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2"
          >
            <RefreshCw size={20} />
            Try Again
          </button>
          <button
            onClick={() => setTopic(null)}
            className="w-full bg-slate-100 text-slate-600 font-bold py-4 rounded-2xl"
          >
            Back to Topics
          </button>
        </div>
      </motion.div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Question {currentIndex + 1} of {questions.length}
        </span>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 w-8 rounded-full transition-all",
                i === currentIndex ? "bg-brand-600" : i < currentIndex ? "bg-brand-200" : "bg-slate-100"
              )}
            />
          ))}
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
                {currentIndex === questions.length - 1 ? "Finish Quiz" : "Next Question"}
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
