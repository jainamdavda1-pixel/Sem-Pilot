import React, { useState } from "react";
import {
  FileText,
  Download,
  Printer,
  Table,
  Calendar,
  AlertCircle
} from "lucide-react";
import { exportToCSV, exportToJSON } from "../services/reportGenerator.js";
import { Button } from "../../../shared/components/Button";

export function ReportsView({
  weeklyReports,
  monthlyReports,
  subjectStats,
  overallStats,
  insights
}) {
  const [reportTab, setReportTab] = useState("weekly");

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 text-left font-sans select-none">
      {/* Action panel with exports */}
      <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
        <div className="space-y-0.5">
          <h3 className="text-sm font-bold text-slate-800">Export Academic Portfolios</h3>
          <p className="text-[11px] text-slate-400">Generate print-ready PDFs or spreadsheet CSV/JSON files of your attendance registry.</p>
        </div>
        <div className="flex gap-2.5 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="flex items-center gap-1.5 justify-center flex-1 sm:flex-initial"
          >
            <Printer className="w-4 h-4 text-slate-500" /> Print PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToCSV(subjectStats, overallStats)}
            className="flex items-center gap-1.5 justify-center flex-1 sm:flex-initial"
          >
            <Download className="w-4 h-4 text-slate-500" /> Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToJSON(subjectStats, overallStats, insights)}
            className="flex items-center gap-1.5 justify-center flex-1 sm:flex-initial"
          >
            <FileText className="w-4 h-4 text-slate-500" /> Export JSON
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-100 pb-px">
        <button
          onClick={() => setReportTab("weekly")}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
            reportTab === "weekly"
              ? "border-primary text-primary"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Weekly Summaries
        </button>
        <button
          onClick={() => setReportTab("monthly")}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
            reportTab === "monthly"
              ? "border-primary text-primary"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Monthly Summaries
        </button>
      </div>

      {/* Reports Content List */}
      <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
        {reportTab === "weekly" && (
          <div className="space-y-4">
            {weeklyReports.length === 0 ? (
              <div className="text-center p-8 space-y-2 text-slate-400 select-none">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-medium">No weekly records accumulated yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-slate-600">
                  <thead>
                    <tr className="border-b border-slate-100 text-left font-bold text-slate-400 uppercase tracking-wider select-none">
                      <th className="pb-3">Academic Week</th>
                      <th className="pb-3 text-center">Lectures Spanned</th>
                      <th className="pb-3 text-center">Present</th>
                      <th className="pb-3 text-center">Absent</th>
                      <th className="pb-3 text-right">Attendance Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weeklyReports.map((w, index) => (
                      <tr key={index} className="border-b border-slate-50 hover:bg-slate-50/40">
                        <td className="py-3 font-semibold text-slate-800 flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" /> {w.week}
                        </td>
                        <td className="py-3 text-center font-medium">{w.total}</td>
                        <td className="py-3 text-center text-emerald-600 font-semibold">{w.present}</td>
                        <td className="py-3 text-center text-rose-500 font-semibold">{w.absent}</td>
                        <td className="py-3 text-right">
                          <span
                            className={`font-bold px-2 py-0.5 rounded ${
                              w.percentage >= overallStats.attendanceRequirement
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-rose-50 text-rose-600"
                            }`}
                          >
                            {w.percentage}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {reportTab === "monthly" && (
          <div className="space-y-4">
            {monthlyReports.length === 0 ? (
              <div className="text-center p-8 space-y-2 text-slate-400 select-none">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-medium">No monthly logs accumulated yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-slate-600">
                  <thead>
                    <tr className="border-b border-slate-100 text-left font-bold text-slate-400 uppercase tracking-wider select-none">
                      <th className="pb-3">Calendar Month</th>
                      <th className="pb-3 text-center">Lectures Spanned</th>
                      <th className="pb-3 text-center">Present</th>
                      <th className="pb-3 text-center">Absent</th>
                      <th className="pb-3 text-right">Attendance Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyReports.map((m, index) => (
                      <tr key={index} className="border-b border-slate-50 hover:bg-slate-50/40">
                        <td className="py-3 font-semibold text-slate-800 flex items-center gap-2">
                          <Table className="w-3.5 h-3.5 text-slate-400" /> {m.month}
                        </td>
                        <td className="py-3 text-center font-medium">{m.total}</td>
                        <td className="py-3 text-center text-emerald-600 font-semibold">{m.present}</td>
                        <td className="py-3 text-center text-rose-500 font-semibold">{m.absent}</td>
                        <td className="py-3 text-right">
                          <span
                            className={`font-bold px-2 py-0.5 rounded ${
                              m.percentage >= overallStats.attendanceRequirement
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-rose-50 text-rose-600"
                            }`}
                          >
                            {m.percentage}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Print-Only Template Layout (Hidden by default, shown during window.print()) */}
      <div id="print-section" className="hidden print:block p-8 space-y-6 text-slate-800 text-left font-sans">
        <div className="border-b-2 border-slate-800 pb-4 flex justify-between items-end">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wide">SemPilot Academic Registry</h1>
            <p className="text-xs text-slate-500 mt-1">Official Semester Attendance & Insights Report</p>
          </div>
          <span className="text-xs text-slate-500">Date: {new Date().toLocaleDateString()}</span>
        </div>

        {/* Overall Grid */}
        <div className="grid grid-cols-2 gap-4 border border-slate-200 rounded-lg p-4 bg-slate-50/30">
          <div>
            <p className="text-xs text-slate-500">Overall Attendance</p>
            <p className="text-xl font-bold text-slate-800">{overallStats.overallAttendancePct}%</p>
            <p className="text-[10px] text-slate-400">(Requirement: {overallStats.attendanceRequirement}%)</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Lectures Logged</p>
            <p className="text-xl font-bold text-slate-800">{overallStats.totalLectures}</p>
            <p className="text-[10px] text-slate-400">({overallStats.present} present, {overallStats.absent} absent)</p>
          </div>
        </div>

        {/* Subjects Table */}
        <div className="space-y-2">
          <h2 className="text-sm font-bold border-b border-slate-200 pb-1">Course Summary Breakdown</h2>
          <table className="w-full text-xs text-slate-600">
            <thead>
              <tr className="border-b border-slate-200 font-bold text-slate-400 uppercase tracking-wider text-left">
                <th className="pb-2">Course Name</th>
                <th className="pb-2">Code</th>
                <th className="pb-2 text-center">Present</th>
                <th className="pb-2 text-center">Absent</th>
                <th className="pb-2 text-center">Remaining</th>
                <th className="pb-2 text-right">Attendance Pct</th>
              </tr>
            </thead>
            <tbody>
              {subjectStats.map((s, idx) => (
                <tr key={idx} className="border-b border-slate-100">
                  <td className="py-2.5 font-semibold text-slate-800">{s.name}</td>
                  <td className="py-2.5">{s.code || "N/A"}</td>
                  <td className="py-2.5 text-center">{s.present}</td>
                  <td className="py-2.5 text-center">{s.absent}</td>
                  <td className="py-2.5 text-center">{s.remainingLectures}</td>
                  <td className="py-2.5 text-right font-bold">{s.attendancePct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Insights Section */}
        {insights.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-bold border-b border-slate-200 pb-1">Dynamic Performance Insights</h2>
            <ul className="list-disc pl-5 text-xs space-y-1.5 text-slate-600">
              {insights.map((ins, idx) => (
                <li key={idx}>
                  <strong className="text-slate-800">{ins.title}:</strong> {ins.text}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="text-center text-[10px] text-slate-400 border-t border-slate-100 pt-4 mt-8">
          Report automatically generated by SemPilot Academic Analytics.
        </div>
      </div>
    </div>
  );
}
