import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../../../../shared/components/Card";

export default function SemesterPreview({ data, onChange }) {
  if (!data) return null;

  return (
    <Card className="border border-slate-200/60 shadow-xs bg-white text-left font-sans">
      <CardHeader className="py-3 border-b border-slate-100 bg-slate-50/30">
        <CardTitle className="text-xs uppercase font-extrabold text-slate-500">Semester Configuration</CardTitle>
      </CardHeader>
      <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-5 gap-4 text-xs font-semibold text-slate-700">
        <div className="space-y-1">
          <label className="text-[10px] text-slate-400 font-bold uppercase block">Name</label>
          <input 
            type="text" 
            value={data.name || ""} 
            onChange={(e) => onChange({ ...data, name: e.target.value })}
            className="w-full p-2 border border-slate-200 rounded focus:outline-none focus:border-primary text-xs"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-slate-400 font-bold uppercase block">Academic Year</label>
          <input 
            type="text" 
            value={data.academicYear || ""} 
            onChange={(e) => onChange({ ...data, academicYear: e.target.value })}
            className="w-full p-2 border border-slate-200 rounded focus:outline-none focus:border-primary text-xs"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-slate-400 font-bold uppercase block">Start Date</label>
          <input 
            type="date" 
            value={data.startDate || ""} 
            onChange={(e) => onChange({ ...data, startDate: e.target.value })}
            className="w-full p-2 border border-slate-200 rounded focus:outline-none focus:border-primary text-xs"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-slate-400 font-bold uppercase block">End Date</label>
          <input 
            type="date" 
            value={data.endDate || ""} 
            onChange={(e) => onChange({ ...data, endDate: e.target.value })}
            className="w-full p-2 border border-slate-200 rounded focus:outline-none focus:border-primary text-xs"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-slate-400 font-bold uppercase block">Attendance threshold (%)</label>
          <input 
            type="number" 
            value={data.attendanceRequirement || 75} 
            onChange={(e) => onChange({ ...data, attendanceRequirement: parseInt(e.target.value, 10) || 75 })}
            className="w-full p-2 border border-slate-200 rounded focus:outline-none focus:border-primary text-xs"
          />
        </div>
      </CardContent>
    </Card>
  );
}
