import { motion } from "motion/react";
import { CheckCircle2, Circle, Clock, ChevronRight, ExternalLink, Lightbulb, Sparkles, BookOpen, Video, Globe, Search } from "lucide-react";
import { RoadmapItem } from "../types";
import { cn } from "../lib/utils";

interface RoadmapProps {
  roadmap: RoadmapItem[];
  onUpdateStatus: (id: string, status: RoadmapItem["status"]) => void;
}

export default function Roadmap({ roadmap, onUpdateStatus }: RoadmapProps) {
  return (
    <div className="space-y-6">
      {/* Quick Study Tip */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-yellow-50 border border-yellow-100 p-4 rounded-2xl flex items-start gap-3"
      >
        <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg shrink-0">
          <Lightbulb size={18} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-yellow-800">Study Tip</h4>
          <p className="text-xs text-yellow-700 leading-relaxed mt-0.5">
            Focus on one module at a time. Complete the resources and mark it as "In Progress" to track your journey effectively!
          </p>
        </div>
      </motion.div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-900">Learning Roadmap</h2>
        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
          {roadmap.length} Modules Total
        </span>
      </div>

      <div className="space-y-4">
        {roadmap.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              "group p-6 rounded-2xl border transition-all",
              item.status === "completed"
                ? "bg-brand-50/50 border-brand-100"
                : item.status === "in_progress"
                ? "bg-white border-brand-500 ring-1 ring-brand-500 shadow-md"
                : "bg-white border-slate-100 hover:border-slate-200"
            )}
          >
            <div className="flex gap-4">
              <button
                onClick={() => onUpdateStatus(item.id, item.status === "completed" ? "todo" : "completed")}
                className={cn(
                  "mt-1 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors",
                  item.status === "completed"
                    ? "bg-brand-600 text-white"
                    : "border-2 border-slate-200 text-transparent hover:border-brand-500"
                )}
              >
                <CheckCircle2 size={16} />
              </button>

              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className={cn(
                      "font-bold text-lg transition-colors",
                      item.status === "completed" ? "text-slate-500 line-through" : "text-slate-900"
                    )}>
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg shrink-0">
                    <Clock size={14} />
                    {item.duration}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {item.topics.map((topic, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-slate-100 text-slate-500 rounded-md"
                    >
                      {topic}
                    </span>
                  ))}
                </div>

                {item.resources && item.resources.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Globe size={12} />
                        External Learning Resources
                      </p>
                      <a 
                        href={`https://www.google.com/search?q=${encodeURIComponent(item.title + " learning resources")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors"
                      >
                        <Search size={10} />
                        Find More
                      </a>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {item.resources.map((res, i) => {
                        const isVideo = res.title.toLowerCase().includes('video') || res.url.includes('youtube') || res.url.includes('vimeo');
                        const isDoc = res.title.toLowerCase().includes('doc') || res.title.toLowerCase().includes('guide') || res.url.includes('docs');
                        
                        return (
                          <a
                            key={i}
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-brand-200 hover:bg-brand-50 hover:shadow-sm transition-all group/res"
                          >
                            <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover/res:text-brand-500 group-hover/res:border-brand-100 transition-colors shrink-0">
                              {isVideo ? <Video size={14} /> : isDoc ? <BookOpen size={14} /> : <Globe size={14} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-700 truncate group-hover/res:text-brand-700">{res.title}</p>
                              <p className="text-[10px] text-slate-400 truncate">{new URL(res.url).hostname}</p>
                            </div>
                            <ExternalLink size={12} className="text-slate-300 group-hover/res:text-brand-400 shrink-0" />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

                {item.status !== "completed" && (
                  <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-50">
                    <button
                      onClick={() => onUpdateStatus(item.id, "in_progress")}
                      className={cn(
                        "text-sm font-bold transition-colors",
                        item.status === "in_progress" ? "text-brand-600" : "text-slate-400 hover:text-slate-600"
                      )}
                    >
                      {item.status === "in_progress" ? "Currently Studying" : "Mark as In Progress"}
                    </button>
                    <div className="flex items-center gap-1 text-sm font-bold text-brand-600">
                      Ready to learn <ChevronRight size={16} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
