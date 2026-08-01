import React from "react";
import {
  Award,
  TrendingUp,
  Zap,
  Calendar,
  FlaskConical,
  Trophy,
  CheckCircle2,
  Lock
} from "lucide-react";

export function AchievementsList({ achievements }) {
  // Map string icon names to Lucide Icon components
  const iconMapping = {
    Award: Award,
    TrendingUp: TrendingUp,
    Zap: Zap,
    Calendar: Calendar,
    FlaskConical: FlaskConical,
    ShieldAlert: Trophy // Map consistency to Trophy for premium look
  };

  return (
    <div className="space-y-6 text-left font-sans">
      <div>
        <h3 className="text-sm font-bold text-slate-800">Academic Achievements & Badges</h3>
        <p className="text-[11px] text-slate-400">Unlock special academic rewards as you maintain your attendance streaks and consistency.</p>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {achievements.map((badge) => {
          const IconComp = iconMapping[badge.icon] || Award;
          
          return (
            <div
              key={badge.id}
              className={`p-5 border rounded-xl flex gap-4 transition-all relative ${
                badge.unlocked
                  ? "bg-white border-emerald-100 shadow-sm hover:shadow-md hover:border-emerald-200"
                  : "bg-slate-50/50 border-slate-100 opacity-60 hover:opacity-75"
              }`}
            >
              {/* Badge Icon circle */}
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  badge.unlocked
                    ? "bg-emerald-50 text-emerald-500 shadow-inner"
                    : "bg-slate-200 text-slate-400"
                }`}
              >
                <IconComp className="w-6 h-6" />
              </div>

              {/* Badge Description */}
              <div className="space-y-1 pr-4">
                <span className="text-sm font-bold text-slate-800 block">
                  {badge.title}
                </span>
                <p className="text-[11px] text-slate-400 leading-snug">
                  {badge.description}
                </p>
                {badge.unlocked && badge.date && (
                  <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50/60 px-1.5 py-0.5 rounded block w-fit mt-1.5 select-none">
                    Unlocked: {new Date(badge.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                )}
              </div>

              {/* Status Lock/Unlock indicator at top-right corner */}
              <div className="absolute top-3 right-3">
                {badge.unlocked ? (
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 fill-emerald-50" />
                ) : (
                  <Lock className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
