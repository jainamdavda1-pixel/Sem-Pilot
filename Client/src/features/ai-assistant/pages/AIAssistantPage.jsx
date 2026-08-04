import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  Send, 
  Trash2, 
  Cpu, 
  Clock, 
  AlertCircle, 
  BookOpen, 
  CheckCircle,
  HelpCircle,
  Zap,
  Info
} from "lucide-react";
import { useAcademicData } from "../../../shared/context/AcademicDataContext";
import { Button } from "../../../shared/components/Button";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5001").replace(/\/$/, "");

export function AIAssistantPage() {
  const { setupData, attendanceLogs } = useAcademicData();
  const [messages, setMessages] = useState(() => {
    try {
      const cached = localStorage.getItem("sempilot_ai_chat_history");
      return cached ? JSON.parse(cached) : [
        {
          role: "model",
          content: "Hi! I'm your SemPilot Copilot AI. I have access to your active subjects, attendance margins, and assignment deadlines. Ask me anything about your semester, study planning, or if it's safe to skip a class!"
        }
      ];
    } catch {
      return [
        {
          role: "model",
          content: "Hi! I'm your SemPilot Copilot AI. I have access to your active subjects, attendance margins, and assignment deadlines. Ask me anything about your semester, study planning, or if it's safe to skip a class!"
        }
      ];
    }
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const chatEndRef = useRef(null);

  const userObj = JSON.parse(localStorage.getItem("sempilot_user") || "null");
  const userId = userObj?.id || "default-user";

  // Cache chat history
  useEffect(() => {
    localStorage.setItem("sempilot_ai_chat_history", JSON.stringify(messages));
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    if (!textToSend) {
      setInput("");
    }
    setError("");

    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/v1/ai/chat?userId=${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages })
      });

      const body = await res.json();
      if (res.ok && body.success && body.data.text) {
        setMessages([...newMessages, { role: "model", content: body.data.text }]);
      } else {
        throw new Error(body.message || "Failed to generate AI response");
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong. Please check your network connection.");
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    if (window.confirm("Are you sure you want to clear your chat history?")) {
      const defaultMsg = [
        {
          role: "model",
          content: "Hi! I'm your SemPilot Copilot AI. I have access to your active subjects, attendance margins, and assignment deadlines. Ask me anything about your semester, study planning, or if it's safe to skip a class!"
        }
      ];
      setMessages(defaultMsg);
      setError("");
    }
  };

  const suggestions = [
    { label: "📅 Summarize schedule", text: "Give me a summary of my active subjects, difficulty levels, and weekly schedule." },
    { label: "❌ Can I skip class?", text: "Can I skip my next class? Check my current attendance margins for my subjects." },
    { label: "📝 Generate study plan", text: "Create a study plan for my high-priority assignments and exams." },
    { label: "💡 Study tips", text: "Give me customized study tips and time-management advice for my hardest subject." }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 font-sans text-left items-start select-none">
      
      {/* Left Chat Window (3 columns) */}
      <div className="lg:col-span-3 flex flex-col h-[calc(100vh-180px)] min-h-[500px] bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
        
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-150">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 tracking-tight">AI Copilot Tutor</h2>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Gemini 2.5 Flash Connected
              </span>
            </div>
          </div>
          <button 
            onClick={clearChat}
            className="p-2 border border-slate-200 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-xl transition duration-150 cursor-pointer"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/20">
          {messages.map((msg, index) => {
            const isUser = msg.role === "user";
            return (
              <div 
                key={index}
                className={`flex gap-3 max-w-[85%] ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
              >
                {/* Icon */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border shrink-0 select-none ${
                  isUser 
                    ? "bg-slate-100 border-slate-200 text-slate-600" 
                    : "bg-indigo-50 border-indigo-100 text-indigo-600"
                }`}>
                  {isUser ? "👤" : "🤖"}
                </div>

                {/* Bubble */}
                <div className={`p-4 rounded-2xl text-sm leading-relaxed border whitespace-pre-wrap ${
                  isUser 
                    ? "bg-indigo-600 border-indigo-700 text-white shadow-sm" 
                    : "bg-white border-slate-200/60 text-slate-800 shadow-xs text-left"
                }`}>
                  {msg.content}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 max-w-[85%] mr-auto items-center">
              <div className="w-8 h-8 rounded-full flex items-center justify-center border bg-indigo-50 border-indigo-100 text-indigo-600 shrink-0">
                🤖
              </div>
              <div className="bg-white border border-slate-200/60 p-4 rounded-2xl shadow-xs text-xs text-slate-400 flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span>Copilot is typing...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs flex gap-2 items-start max-w-[80%] mx-auto">
              <AlertCircle className="w-4.5 h-4.5 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Suggestions Panel */}
        {messages.length === 1 && (
          <div className="px-6 py-3 border-t border-slate-100 bg-white grid grid-cols-2 gap-2">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(s.text)}
                className="p-2.5 text-left border border-slate-200/80 hover:border-indigo-400 hover:bg-indigo-50/20 rounded-xl transition duration-150 cursor-pointer text-xs font-semibold text-slate-700 block"
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-100 bg-white flex gap-2">
          <input
            type="text"
            placeholder="Ask Copilot about study schedules, skips, or attendance safety..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            disabled={loading}
            className="flex-1 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none transition duration-150 font-medium"
          />
          <Button 
            onClick={() => handleSendMessage()}
            disabled={loading || !input.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 px-4.5 py-1 rounded-xl text-xs font-bold transition flex items-center justify-center shrink-0 shadow-sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

      </div>

      {/* Right Sidebar Knowledge Base (1 column) */}
      <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm p-5 space-y-5 text-xs">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Cpu className="w-4.5 h-4.5 text-indigo-500" /> Copilot Context
          </h3>
          <p className="text-[10px] text-slate-400">The information SemPilot AI has active access to for answering queries.</p>
        </div>

        <div className="border-t border-slate-100 pt-4 space-y-4">
          <div className="space-y-2">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px] block">Semester Settings</span>
            {setupData?.semesterInfo ? (
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-left">
                <div className="font-bold text-slate-800">{setupData.semesterInfo.name}</div>
                <div className="text-[10px] text-slate-500">Year: {setupData.semesterInfo.academicYear}</div>
                <div className="text-[10px] text-slate-500">Goal Target: {setupData.semesterInfo.attendanceRequirement}%</div>
              </div>
            ) : (
              <div className="p-2.5 bg-amber-50/50 border border-amber-100 rounded-xl text-amber-600 text-[10px] leading-normal flex gap-1.5">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.2" /> No active semester setup details discovered.
              </div>
            )}
          </div>

          <div className="space-y-2">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px] block">Tracked Subjects</span>
            {setupData?.subjects && setupData.subjects.length > 0 ? (
              <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-0.5">
                {setupData.subjects.map((sub, i) => (
                  <div key={i} className="flex justify-between items-center p-2 border border-slate-100 rounded-lg bg-white shadow-xs">
                    <span className="font-semibold text-slate-700 truncate max-w-[120px]">{sub.name}</span>
                    <span className="text-[10px] text-slate-400 font-bold shrink-0">{sub.code}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[10px] text-slate-400 italic">No subject courses imported yet.</div>
            )}
          </div>

          <div className="p-3.5 bg-indigo-50/40 border border-indigo-100/50 rounded-xl text-[10px] leading-normal text-indigo-700 space-y-1.5">
            <div className="font-bold flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 shrink-0" /> Prompt Examples
            </div>
            <ul className="list-disc pl-4 space-y-1 font-medium">
              <li>"Analyze which subject is my highest academic priority."</li>
              <li>"Give me study tips to manage my workload."</li>
              <li>"Check if I can skip a lecture today."</li>
            </ul>
          </div>
        </div>

      </div>

    </div>
  );
}
