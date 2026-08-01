import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import {
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CheckCircle,
  XCircle,
  HelpCircle
} from "lucide-react";
import { Badge } from "../../../shared/components/Badge";

export function SubjectComparison({ subjectStats, attendanceRequirement = 75 }) {
  // 1. Data mapping for Recharts Comparison Chart
  const chartData = useMemo(() => {
    return subjectStats.map((s) => ({
      name: s.name.length > 15 ? `${s.name.substring(0, 15)}...` : s.name,
      Present: s.present,
      Absent: s.absent
    }));
  }, [subjectStats]);

  // Risk badges color configuration
  const getRiskStyles = (risk) => {
    switch (String(risk || "").toLowerCase()) {
      case "critical":
        return { bg: "bg-red-50 text-red-700 border-red-200", label: "Critical" };
      case "high":
        return { bg: "bg-orange-50 text-orange-700 border-orange-200", label: "High" };
      case "moderate":
        return { bg: "bg-amber-50 text-amber-700 border-amber-200", label: "Moderate" };
      default:
        return { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Safe" };
    }
  };

  return (
    <div className="space-y-8 text-left font-sans">
      {/* Visual Charts Comparison */}
      <div className="bg-white p-5 border border-slate-100 rounded-xl shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Subject Attendance Comparison</h3>
          <p className="text-[11px] text-slate-400">Comparing total present vs absent lecture counts per course.</p>
        </div>
        <div className="h-64 w-full">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400 font-medium">
              No subject comparisons to show
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.96)",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "11px"
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "10px" }} />
                <Bar dataKey="Present" stackId="a" fill="#10B981" />
                <Bar dataKey="Absent" stackId="a" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Subjects Detailed Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-800">Subject Breakdown & Action Plan</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {subjectStats.map((sub) => {
            const risk = getRiskStyles(sub.riskLevel);
            const isBelowTarget = sub.attendancePct < attendanceRequirement;

            return (
              <div
                key={sub.id}
                className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between"
              >
                {/* Header: Title, Code, Risk Tag */}
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-800 leading-tight">
                        {sub.name}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 px-1.5 py-0.5 bg-slate-50 border border-slate-100 rounded">
                        {sub.code || "N/A"}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Credits: {sub.credits} | Remaining: {sub.remainingLectures} classes ({sub.remainingHours}h)
                    </p>
                  </div>
                  {/* Risk Badge */}
                  <span
                    className={`text-[9px] font-bold border rounded px-2 py-0.5 ${risk.bg}`}
                  >
                    {risk.label} Risk ({sub.riskScore})
                  </span>
                </div>

                {/* Performance Stats: Current vs Projected */}
                <div className="grid grid-cols-3 gap-3 py-3 border-y border-slate-50 text-center">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                      Current Attendance
                    </span>
                    <span
                      className={`text-base font-extrabold block ${
                        isBelowTarget ? "text-amber-500" : "text-emerald-500"
                      }`}
                    >
                      {sub.attendancePct}%
                    </span>
                    <span className="text-[9px] text-slate-400 font-semibold">
                      ({sub.present}/{sub.present + sub.absent} classes)
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                      Projected Final
                    </span>
                    <span className="text-base font-extrabold text-indigo-500 block">
                      {sub.projectedFinalAttendance}%
                    </span>
                    <span className="text-[9px] text-slate-400 font-semibold">
                      (if attend all remaining)
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                      Trend Profile
                    </span>
                    <div className="flex items-center justify-center gap-1 mt-1 text-slate-700">
                      {sub.trend === "up" && (
                        <span className="text-xs font-bold text-emerald-500 flex items-center gap-0.5">
                          <ArrowUpRight className="w-3.5 h-3.5" /> Rising
                        </span>
                      )}
                      {sub.trend === "down" && (
                        <span className="text-xs font-bold text-red-500 flex items-center gap-0.5">
                          <ArrowDownRight className="w-3.5 h-3.5" /> Falling
                        </span>
                      )}
                      {sub.trend === "stable" && (
                        <span className="text-xs font-bold text-slate-500 flex items-center gap-0.5">
                          <Minus className="w-3.5 h-3.5" /> Stable
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sub-types breakdown (Theory vs Labs) */}
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium select-none">
                  <span>Theory Attended: <strong className="text-slate-600">{sub.theoryHours}h</strong></span>
                  <span>Lab Attended: <strong className="text-slate-600">{sub.labHours}h</strong></span>
                  <span>Avg Weekly Classes: <strong className="text-slate-600">{sub.avgWeeklyAttendance}</strong></span>
                </div>

                {/* Dynamic Strategic Recommendation Footer */}
                <div className="pt-2">
                  {isBelowTarget ? (
                    <div className="p-2.5 bg-rose-50/50 border border-rose-100 rounded-lg flex items-center gap-2 text-[11px] text-rose-700 leading-tight">
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                      <div>
                        <span>Below Target ({attendanceRequirement}%).</span>
                        <strong className="block mt-0.5">Must attend the next {sub.needToAttend} classes consecutively to recover.</strong>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-emerald-50/50 border border-emerald-100 rounded-lg flex items-center gap-2 text-[11px] text-emerald-700 leading-tight">
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div>
                        <span>Above Target ({attendanceRequirement}%).</span>
                        <strong className="block mt-0.5">
                          {sub.canSafelySkip === 0
                            ? "At threshold limit. Bunking the next class will put you below target."
                            : `Safe buffer. You can skip the next ${sub.canSafelySkip} classes safely.`}
                        </strong>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
