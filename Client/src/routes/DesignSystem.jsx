import React from "react";
import {
  GraduationCap,
  CalendarCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Layers,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { Button } from "../shared/components/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../shared/components/Card";
import { Badge } from "../shared/components/Badge";
import { Progress } from "../shared/components/Progress";
import { SectionHeader } from "../shared/components/SectionHeader";
import { StatCard } from "../shared/components/StatCard";
import { TimelineCard } from "../shared/components/TimelineCard";
import { AttendanceCard } from "../features/attendance/components/AttendanceCard";
import { CalendarCard } from "../shared/components/CalendarCard";
import { RecommendationCard } from "../shared/components/RecommendationCard";

export default function DesignSystem() {
  // Mock event dates for calendar
  const mockCalendarEvents = [
    { day: 5, type: "success" },
    { day: 8, type: "info" },
    { day: 12, type: "warning" },
    { day: 15, type: "success" },
    { day: 22, type: "danger" },
    { day: 26, type: "success" },
    { day: 27, type: "info" },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Intro Header */}
      <SectionHeader
        title="Design System & Component Library"
        description="SemPilot design tokens, typography, atomic UI primitives, and custom domain-specific components."
      >
        <Button variant="outline" size="sm">
          Docs
        </Button>
        <Button variant="primary" size="sm">
          Deploy Prototype
        </Button>
      </SectionHeader>

      {/* 1. Design Tokens */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider select-none">
          1. Color Palette & Typography
        </h3>
        <Card>
          <CardContent className="p-6 space-y-6">
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Color Swatches</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                <div className="space-y-1.5">
                  <div className="h-10 w-full rounded bg-white border border-slate-200" />
                  <p className="text-[10px] font-semibold text-slate-700">Primary BG</p>
                  <p className="text-[9px] text-slate-400 font-mono">#FFFFFF</p>
                </div>
                <div className="space-y-1.5">
                  <div className="h-10 w-full rounded bg-slate-50 border border-slate-200" />
                  <p className="text-[10px] font-semibold text-slate-700">Secondary BG</p>
                  <p className="text-[9px] text-slate-400 font-mono">#F8FAFC</p>
                </div>
                <div className="space-y-1.5">
                  <div className="h-10 w-full rounded bg-primary" />
                  <p className="text-[10px] font-semibold text-slate-700">Accent Blue</p>
                  <p className="text-[9px] text-slate-400 font-mono">#2563EB</p>
                </div>
                <div className="space-y-1.5">
                  <div className="h-10 w-full rounded bg-emerald-500" />
                  <p className="text-[10px] font-semibold text-slate-700">Success Green</p>
                  <p className="text-[9px] text-slate-400 font-mono">#10B981</p>
                </div>
                <div className="space-y-1.5">
                  <div className="h-10 w-full rounded bg-amber-500" />
                  <p className="text-[10px] font-semibold text-slate-700">Warning Amber</p>
                  <p className="text-[9px] text-slate-400 font-mono">#F59E0B</p>
                </div>
                <div className="space-y-1.5">
                  <div className="h-10 w-full rounded bg-red-500" />
                  <p className="text-[10px] font-semibold text-slate-700">Danger Red</p>
                  <p className="text-[9px] text-slate-400 font-mono">#EF4444</p>
                </div>
                <div className="space-y-1.5">
                  <div className="h-10 w-full rounded bg-slate-200" />
                  <p className="text-[10px] font-semibold text-slate-700">Borders/Inputs</p>
                  <p className="text-[9px] text-slate-400 font-mono">#E2E8F0</p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Typography & Scale</h4>
              <p className="text-2xl font-bold tracking-tight text-slate-900">Inter Sans-Serif</p>
              <p className="text-sm text-slate-500 mt-1 max-w-xl leading-relaxed">
                The typography scales gracefully to maintain a clean layout hierarchy. Standard weights used are Light (300), Regular (400), Medium (500), Semibold (600), and Bold (700).
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 2. Atomic UI Elements */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider select-none">
          2. Atomic UI Primitives
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Buttons showcase */}
          <Card>
            <CardHeader>
              <CardTitle>Buttons</CardTitle>
              <CardDescription>Different styles and sizing variants</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link Style</Button>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
                <Button variant="outline" size="icon">
                  <TrendingUp className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Badges and Progress showcase */}
          <Card className="flex flex-col justify-between">
            <div>
              <CardHeader>
                <CardTitle>Badges & Progress Bars</CardTitle>
                <CardDescription>Status indicators and tracking visualizations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="default">Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="success">Success</Badge>
                  <Badge variant="warning">Warning</Badge>
                  <Badge variant="danger">Danger</Badge>
                  <Badge variant="outline">Outline</Badge>
                </div>
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-500">
                      <span>Database Design</span>
                      <span>85%</span>
                    </div>
                    <Progress value={85} variant="success" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-500">
                      <span>Calculus II</span>
                      <span>72% (Critical)</span>
                    </div>
                    <Progress value={72} variant="warning" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-500">
                      <span>Physics Lab</span>
                      <span>45% (Unsafe)</span>
                    </div>
                    <Progress value={45} variant="danger" />
                  </div>
                </div>
              </CardContent>
            </div>
          </Card>
        </div>
      </section>

      {/* 3. Composite Dashboard Components */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider select-none">
          3. Composite Student Components
        </h3>
        
        {/* Stat Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            title="Overall Attendance"
            value="82.4%"
            description="Goal: 75% (+4 lectures above threshold)"
            icon={GraduationCap}
            trend={{ text: "+1.2% this week", type: "success" }}
          />
          <StatCard
            title="Active Modules"
            value="6 Courses"
            description="3 core fields, 2 electives, 1 lab"
            icon={Layers}
            trend={{ text: "Active Sem", type: "secondary" }}
          />
          <StatCard
            title="Alerts Pending"
            value="2 Warning"
            description="Calculus II requires next 2 lectures"
            icon={AlertTriangle}
            trend={{ text: "Urgent action", type: "danger" }}
          />
        </div>

        {/* Timetable and Calendar Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          
          {/* Lecture/Timeline column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Timetable Timeline Cards
              </h4>
              <span className="text-xs text-primary font-medium cursor-pointer hover:underline">
                View Full
              </span>
            </div>
            
            <div className="space-y-3">
              <TimelineCard
                time="09:00 - 10:30"
                title="Linear Algebra & Matrix Analysis"
                subtitle="Lecture Hall B • Dr. Sarah Jenkins"
                status="Next up"
                statusType="default"
              />
              <TimelineCard
                time="11:00 - 12:30"
                title="Introduction to Database Systems"
                subtitle="Lab Room 402 • Prof. Raymond Holt"
                status="Completed"
                statusType="success"
              />
              <TimelineCard
                time="14:00 - 15:30"
                title="Modern Physics Laboratory"
                subtitle="Physics Block Annex • Dr. Beverly Crusher"
                status="Cancelled"
                statusType="danger"
              />
            </div>
          </div>

          {/* Calendar column */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Academic Calendar Grid
            </h4>
            <CalendarCard events={mockCalendarEvents} />
          </div>
        </div>

        {/* Attendance Tracker Cards & Suggestions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Attendance Subject Cards
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AttendanceCard
                courseCode="CS-301"
                courseName="Database Management"
                attended={21}
                total={24}
                target={75}
                history={[true, true, true, false, true]}
                statusText="Safe (+3 classes)"
                statusType="success"
              />
              <AttendanceCard
                courseCode="MA-201"
                courseName="Calculus II"
                attended={14}
                total={20}
                target={75}
                history={[false, true, false, true, true]}
                statusText="Critical (-1 class)"
                statusType="warning"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              AI Roadmap / Suggestions
            </h4>
            <RecommendationCard
              title="Attendance Recovery Assistant"
              description="You have fallen 1 class below target in Calculus II. Attending the lectures on Thursday and Friday will restore your record to 75.3%."
              actionText="Add to Study Plan"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
