import React from "react";
import { X, Filter } from "lucide-react";
import { Button } from "../../../shared/components/Button";

export function HistoryFilters({ 
  subjects = [], 
  selectedSubject, 
  setSelectedSubject,
  selectedType,
  setSelectedType,
  selectedStatus,
  setSelectedStatus,
  selectedMonth,
  setSelectedMonth,
  onResetFilters 
}) {
  
  // List of standard months
  const months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const hasActiveFilters = 
    selectedSubject !== "all" || 
    selectedType !== "all" || 
    selectedStatus !== "all" || 
    selectedMonth !== "all";

  return (
    <div className="p-4 border border-slate-200/60 bg-white rounded-lg shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 select-none text-left">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold mr-1">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters:</span>
        </div>

        {/* Filter by Subject */}
        <div className="space-y-0.5">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="h-8 px-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 focus:outline-none focus:border-primary"
          >
            <option value="all">All Subjects</option>
            {subjects.map((sub) => (
              <option key={sub.name} value={sub.name}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filter by Type */}
        <div className="space-y-0.5">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="h-8 px-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 focus:outline-none focus:border-primary"
          >
            <option value="all">All Types</option>
            <option value="Theory">Theory</option>
            <option value="Lab">Lab</option>
          </select>
        </div>

        {/* Filter by Status */}
        <div className="space-y-0.5">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-8 px-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 focus:outline-none focus:border-primary"
          >
            <option value="all">All Statuses</option>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
          </select>
        </div>

        {/* Filter by Month */}
        <div className="space-y-0.5">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="h-8 px-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 focus:outline-none focus:border-primary"
          >
            <option value="all">All Months</option>
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onResetFilters}
          className="h-7 text-[10px] text-slate-400 hover:text-slate-700 border border-slate-100 hover:bg-slate-50 self-start md:self-auto"
        >
          <X className="w-3 h-3 mr-1" />
          Clear Filters
        </Button>
      )}
    </div>
  );
}
export default HistoryFilters;
