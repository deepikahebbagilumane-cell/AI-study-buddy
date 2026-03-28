import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Bot, User as UserIcon, Loader2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { User } from "../types";
import { geminiService } from "../services/gemini";
import { chatService, ChatMessage } from "../services/chat";
import { cn } from "../lib/utils";

interface AIAssistantProps {
  user: User;
}

export default function AIAssistant({ user }: AIAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const fetchHistory = async () => {
      const history = await chatService.getHistory();
      if (history.length === 0) {
        const welcomeMessage = {
          id: "welcome",
          userId: user.id,
          role: "model" as const,
          text: `Hi ${user.name.split(" ")[0]}! I'm your AI Study Buddy. I'm here to help you with your **${user.course}** course. Feel free to ask me any doubts, or we can discuss a specific topic!`,
          timestamp: new Date().toISOString(),
        };
        setMessages([welcomeMessage]);
        await chatService.saveMessage("model", welcomeMessage.text);
      } else {
        setMessages(history);
      }
    };
    fetchHistory();
  }, [user.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessageText = input.trim();
    setInput("");
    
    // Optimistically add user message
    const tempUserMsg: ChatMessage = {
      id: Date.now().toString(),
      userId: user.id,
      role: "user",
      text: userMessageText,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);
    setIsLoading(true);

    try {
      // Save user message to backend
      await chatService.saveMessage("user", userMessageText);

      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));

      const response = await geminiService.chat(userMessageText, {
        course: user.course!,
        studentType: user.studentType!,
        history,
      });

      const modelText = response || "I'm sorry, I couldn't process that.";
      
      // Save model response to backend
      const savedModelMsg = await chatService.saveMessage("model", modelText);
      
      if (savedModelMsg) {
        setMessages(prev => [...prev, savedModelMsg]);
      } else {
        setMessages(prev => [...prev, { 
          id: Date.now().toString(), 
          userId: user.id, 
          role: "model", 
          text: modelText, 
          timestamp: new Date().toISOString() 
        }]);
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        userId: user.id, 
        role: "model", 
        text: error.message || "Oops! Something went wrong. Please try again.", 
        timestamp: new Date().toISOString() 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[75vh] bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">AI Study Tutor</h3>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Online & Ready</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs font-bold text-brand-600 bg-brand-50 px-3 py-1 rounded-full">
          <Sparkles size={14} />
          Adapting to {user.studentType?.replace("_", " ")} style
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((message, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex gap-4 max-w-[85%]",
              message.role === "user" ? "ml-auto flex-row-reverse" : ""
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
              message.role === "user" ? "bg-slate-200 text-slate-600" : "bg-brand-100 text-brand-600"
            )}>
              {message.role === "user" ? <UserIcon size={16} /> : <Bot size={16} />}
            </div>
            <div className={cn(
              "p-4 rounded-2xl text-sm leading-relaxed",
              message.role === "user" 
                ? "bg-brand-600 text-white rounded-tr-none" 
                : "bg-slate-100 text-slate-800 rounded-tl-none markdown-body"
            )}>
              <ReactMarkdown>{message.text}</ReactMarkdown>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex gap-4 max-w-[85%]">
            <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center shrink-0">
              <Bot size={16} />
            </div>
            <div className="bg-slate-100 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 bg-slate-50 border-t border-slate-100">
        <div className="relative flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a doubt or discuss a concept..."
            className="flex-1 bg-white border border-slate-200 rounded-2xl px-5 py-4 pr-14 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 disabled:opacity-50 disabled:hover:bg-brand-600 transition-all shadow-md shadow-brand-500/20"
          >
            <Send size={20} />
          </button>
        </div>
        <p className="text-[10px] text-center text-slate-400 mt-3 font-medium uppercase tracking-widest">
          Powered by Gemini AI • Personalized for your learning style
        </p>
      </form>
    </div>
  );
}
