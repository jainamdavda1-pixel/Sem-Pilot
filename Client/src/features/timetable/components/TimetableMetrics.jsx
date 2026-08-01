import React from "react";
import { BookOpen, Layers, GraduationCap, Laptop, CalendarCheck } from "lucide-react";
import { Card, CardContent } from "../../../shared/components/Card";
import { cn } from "../../../shared/utils/utils";

export function TimetableMetrics({ entries = [], className }) {
  // 1. Total unique subjects
  const uniqueSubjects = [...new Set(entries.map((e) => e.subjectName).filter(Boolean))];
  const totalSubjects = uniqueSubjects.length;

  // 2. Weekly scheduled theory lecture slots
  const theoryLectures = entries.filter((e) => e.lectureType === "Theory");
  const weeklyLectures = theoryLectures.length;

  // 3. Weekly scheduled lab sessions
  const labSessions = entries.filter((e) => e.lectureType === "Lab");
  const weeklyLabSessions = labSessions.length;

  // 4. Subjects that have at least one Theory slot
  const subjectsWithTheory = [...new Set(theoryLectures.map((e) => e.subjectName))].length;

  // 5. Subjects that have at least one Lab slot
  const subjectsWithLab = [...new Set(labSessions.map((e) => e.subjectName))].length;

  const metrics = [
    {
      title: "Total Subjects",
      value: totalSubjects,
      description: "Unique modules",
      icon: BookOpen,
      color: "text-blue-600 bg-blue-50 border-blue-100",
    },
    {
      title: "Weekly Lectures",
      value: weeklyLectures,
      description: "Theory sessions",
      icon: CalendarCheck,
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
    },
    {
      title: "Weekly Labs",
      value: weeklyLabSessions,
      description: "Practical slots",
      icon: Laptop,
      color: "text-purple-600 bg-purple-50 border-purple-100",
    },
    {
      title: "Theory Courses",
      value: subjectsWithTheory,
      description: "Modules with theory",
      icon: GraduationCap,
      color: "text-amber-600 bg-amber-50 border-amber-100",
    },
    {
      title: "Lab Courses",
      value: subjectsWithLab,
      description: "Modules with lab",
      icon: Layers,
      color: "text-pink-600 bg-pink-50 border-pink-100",
    },
  ];

  return (
    <div className={cn("grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4", className)}>
      {metrics.map((m, idx) => (
        <Card key={idx} className="border border-slate-200/60 bg-white shadow-sm overflow-hidden select-none hover:border-slate-300 transition-colors">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {m.title}
              </span>
              <div className={cn("w-7 h-7 rounded-md border flex items-center justify-center shrink-0", m.color)}>
                <m.icon className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-3.5 space-y-0.5">
              <span className="text-2xl font-bold tracking-tight text-slate-800">
                {m.value}
              </span>
              <p className="text-[10px] text-slate-400 font-medium">
                {m.description}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
export default TimetableMetrics;
