import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from "recharts";
import {
  Award,
  Calendar,
  Clock,
  Flame,
  AlertCircle,
  TrendingUp,
  Info,
  CheckCircle,
  XCircle,
  MinusCircle
} from "lucide-react";

export function AnalyticsOverview({ overallStats, subjectStats, mergedLectures, insights }) {
  // 1. Calculate cumulative attendance trend over time
  const trendData = useMemo(() => {
    const activeLogs = [...mergedLectures]
      .filter((l) => l.isLogged && (l.status === "Present" || l.status === "Absent"))
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

    let presentAccum = 0;
    return activeLogs.map((log, index) => {
      if (log.status === "Present") presentAccum++;
      const totalAccum = index + 1;
      const pct = Math.round((presentAccum / totalAccum) * 100);
      return {
        date: new Date(log.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        "Attendance %": pct,
        subject: log.subjectName
      };
    });
  }, [mergedLectures]);

  // 2. Attendance status breakdown for Pie Chart
  const pieData = useMemo(() => {
    return [
      { name: "Present", value: overallStats.present, color: "#10B981" }, // emerald
      { name: "Absent", value: overallStats.absent, color: "#EF4444" }, // red
      { name: "Cancelled", value: overallStats.cancelled, color: "#94A3B8" }, // slate
      { name: "Holiday", value: overallStats.holidayCount, color: "#EAB308" } // yellow
    ].filter((item) => item.value > 0);
  }, [overallStats]);

  // 3. Monthly attendance for Area Chart
  const monthlyData = useMemo(() => {
    const monthlyMap = {};
    mergedLectures
      .filter((l) => l.isLogged && (l.status === "Present" || l.status === "Absent"))
      .forEach((log) => {
        const month = new Date(log.date).toLocaleDateString("en-US", { month: "short", year: "numeric" });
        if (!monthlyMap[month]) {
          monthlyMap[month] = { present: 0, total: 0 };
        }
        if (log.status === "Present") monthlyMap[month].present++;
        monthlyMap[month].total++;
      });

    return Object.keys(monthlyMap).map((month) => {
      const { present, total } = monthlyMap[month];
      return {
        name: month,
        "Attendance %": Math.round((present / total) * 100),
        "Total Classes": total
      };
    });
  }, [mergedLectures]);

  return (
    <div className="space-y-8 text-left">
      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Attendance Percentage Card */}
        <div className="bg-white p-5 border border-slate-100 rounded-xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
            <Award className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Overall Attendance
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-800">
                {overallStats.overallAttendancePct}%
              </span>
              <span className="text-xs text-slate-400 font-semibold">
                (target {overallStats.attendanceRequirement}%)
              </span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  overallStats.overallAttendancePct >= overallStats.attendanceRequirement
                    ? "bg-emerald-500"
                    : "bg-amber-500"
                }`}
                style={{ width: `${Math.min(100, overallStats.overallAttendancePct)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Streaks Card */}
        <div className="bg-white p-5 border border-slate-100 rounded-xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Active Streaks
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-slate-800">
                {overallStats.currentStreak}
              </span>
              <span className="text-xs text-slate-400 font-semibold">
                Current (longest: {overallStats.longestStreak})
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 font-medium">
              Keep attending consecutive lectures!
            </p>
          </div>
        </div>

        {/* Total Lectures Logged */}
        <div className="bg-white p-5 border border-slate-100 rounded-xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Logged Lectures
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-slate-800">
                {overallStats.totalLectures}
              </span>
              <span className="text-xs text-slate-400 font-semibold">
                ({overallStats.present} present, {overallStats.absent} absent)
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 font-medium">
              {overallStats.cancelled} cancelled / {overallStats.holidayCount} holidays
            </p>
          </div>
        </div>

        {/* Hours Logged */}
        <div className="bg-white p-5 border border-slate-100 rounded-xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Hours Spanned
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-slate-800">
                {overallStats.totalLectureHours}h
              </span>
              <span className="text-xs text-slate-400 font-semibold">
                ({overallStats.totalHoursAttended}h attended)
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 font-medium">
              Missed hours: {overallStats.totalHoursMissed}h
            </p>
          </div>
        </div>
      </div>

      {/* Main Charts Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Trend (Line Chart) */}
        <div className="bg-white p-5 border border-slate-100 rounded-xl shadow-sm lg:col-span-2 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Attendance Trend over Time</h3>
            <p className="text-[11px] text-slate-400">Cumulative attendance percentage after every logged lecture.</p>
          </div>
          <div className="h-64 w-full">
            {trendData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 font-medium">
                Log attendance to show trend lines
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.96)",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      fontSize: "11px"
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Attendance %"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Attendance Breakdown (Pie Chart) */}
        <div className="bg-white p-5 border border-slate-100 rounded-xl shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Attendance Distribution</h3>
            <p className="text-[11px] text-slate-400">Proportional breakdown of logged attendance states.</p>
          </div>
          <div className="h-64 w-full relative flex flex-col justify-center items-center">
            {pieData.length === 0 ? (
              <div className="text-xs text-slate-400 font-medium">No distribution data</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="90%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.96)",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        fontSize: "11px"
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Custom Legend */}
                <div className="flex justify-center flex-wrap gap-x-4 gap-y-1.5 text-[10px] font-semibold text-slate-500 select-none">
                  {pieData.map((d, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span>{d.name} ({d.value})</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Sub-Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Attendance (Area Chart) */}
        <div className="bg-white p-5 border border-slate-100 rounded-xl shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Monthly Attendance Performance</h3>
            <p className="text-[11px] text-slate-400">Attendance percentages aggregated by month.</p>
          </div>
          <div className="h-48 w-full">
            {monthlyData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 font-medium">
                No monthly data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorPct" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.96)",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      fontSize: "11px"
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Attendance %"
                    stroke="#4f46e5"
                    fillOpacity={1}
                    fill="url(#colorPct)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Quick Insights Container */}
        <div className="bg-white p-5 border border-slate-100 rounded-xl shadow-sm lg:col-span-2 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Quick Strategic Insights</h3>
            <p className="text-[11px] text-slate-400">Dynamic AI-driven feedback based on recent performance habits.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[195px] overflow-y-auto pr-1">
            {insights.slice(0, 4).map((ins, idx) => {
              let bg = "bg-blue-50/50 border-blue-100 text-blue-800";
              let Icon = Info;
              if (ins.type === "success") {
                bg = "bg-emerald-50/50 border-emerald-100 text-emerald-800";
                Icon = CheckCircle;
              } else if (ins.type === "warning") {
                bg = "bg-rose-50/50 border-rose-100 text-rose-800";
                Icon = AlertCircle;
              }
              return (
                <div
                  key={idx}
                  className={`p-3.5 border rounded-xl flex gap-3 text-xs leading-relaxed transition-all hover:shadow-sm ${bg}`}
                >
                  <Icon className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold block tracking-tight">{ins.title}</span>
                    <p className="opacity-90">{ins.text}</p>
                  </div>
                </div>
              );
            })}
            {insights.length === 0 && (
              <div className="col-span-2 flex items-center justify-center h-28 text-xs text-slate-400 font-semibold select-none">
                No insights calculated yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
