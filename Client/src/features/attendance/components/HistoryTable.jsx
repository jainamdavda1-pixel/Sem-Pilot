import React from "react";
import { Trash2, Calendar, Clock } from "lucide-react";
import { Badge } from "../../../shared/components/Badge";
import { cn } from "../../../shared/utils/utils";

export function HistoryTable({ logs = [], onUpdateStatus, onDeleteLog }) {
  
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDayName = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-US", { weekday: "short" });
  };

  return (
    <div className="border border-slate-200 bg-white rounded-lg shadow-sm overflow-hidden select-none">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs table-fixed min-w-[640px]">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider select-none">
              <th className="p-3.5 w-32">Date</th>
              <th className="p-3.5 w-24">Day</th>
              <th className="p-3.5">Subject</th>
              <th className="p-3.5 w-24">Type</th>
              <th className="p-3.5 w-36 text-center">Status Toggle</th>
              <th className="p-3.5 w-16 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-400 select-none">
                  No attendance records match your filter criteria.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50/20 last:border-0 transition-colors">
                  {/* Date */}
                  <td className="p-3.5 font-medium text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {formatDate(log.date)}
                    </span>
                  </td>

                  {/* Weekday name */}
                  <td className="p-3.5 text-slate-500 font-medium">
                    {getDayName(log.date)}
                  </td>

                  {/* Subject Name & Timing */}
                  <td className="p-3.5 min-w-0">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-slate-800 truncate">{log.subjectName}</p>
                      {log.startTime && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-300" />
                          {log.startTime} - {log.endTime}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Type */}
                  <td className="p-3.5">
                    <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider py-0">
                      {log.lectureType}
                    </Badge>
                  </td>

                  {/* Status Toggle pills */}
                  <td className="p-3.5 text-center">
                    <div className="inline-flex border border-slate-200 rounded p-0.5 bg-slate-50">
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(log.id, "Present")}
                        className={cn(
                          "px-2.5 py-0.5 text-[10px] font-bold rounded cursor-pointer transition-colors select-none",
                          log.status === "Present"
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "text-slate-500 hover:text-slate-800"
                        )}
                      >
                        Present
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(log.id, "Absent")}
                        className={cn(
                          "px-2.5 py-0.5 text-[10px] font-bold rounded cursor-pointer transition-colors select-none",
                          log.status === "Absent"
                            ? "bg-red-600 text-white shadow-sm"
                            : "text-slate-500 hover:text-slate-800"
                        )}
                      >
                        Absent
                      </button>
                    </div>
                  </td>

                  {/* Clear Action */}
                  <td className="p-3.5 text-center">
                    <button
                      type="button"
                      onClick={() => onDeleteLog(log.id)}
                      className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-slate-50 transition-colors"
                      title="Delete Record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>

                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export default HistoryTable;
