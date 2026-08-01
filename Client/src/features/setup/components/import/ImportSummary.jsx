import React from "react";
import { Check, AlertTriangle, HelpCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../../../../shared/components/Card";

export default function ImportSummary({ report }) {
  if (!report) return null;

  return (
    <Card className="max-w-md w-full border border-slate-200/80 bg-white shadow-2xl overflow-hidden p-6 space-y-6 text-left font-sans">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto">
          <Check className="w-6 h-6 text-emerald-500" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Academic Data Ingested</h3>
        <p className="text-xs text-slate-500 leading-normal">
          All validated entries have been stored in the database. Redirecting to Overview...
        </p>
      </div>

      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 text-xs space-y-2.5">
        <div className="flex justify-between items-center text-slate-600">
          <span>Semester Configuration:</span>
          <span className="font-bold text-slate-800">{report.semesterImported}</span>
        </div>
        <div className="border-t border-slate-200/50 my-2" />
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Faculties Added</span>
            <span className="font-extrabold text-sm text-slate-800">{report.facultyImportedCount || 0}</span>
          </div>
          <div className="space-y-1">
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Subjects Catalog</span>
            <span className="font-extrabold text-sm text-slate-800">{report.subjectsImportedCount || 0}</span>
          </div>
          <div className="space-y-1">
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Timetable Lectures</span>
            <span className="font-extrabold text-sm text-slate-800">{report.lecturesImportedCount || 0}</span>
          </div>
          <div className="space-y-1">
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Holiday Records</span>
            <span className="font-extrabold text-sm text-slate-800">{report.holidaysImportedCount || 0}</span>
          </div>
          <div className="space-y-1">
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Total Ingested</span>
            <span className="font-extrabold text-sm text-slate-800">{report.totalRecords || 0}</span>
          </div>
          <div className="space-y-1">
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Import Duration</span>
            <span className="font-extrabold text-sm text-slate-800">{(report.durationMs / 1000).toFixed(2)}s</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
