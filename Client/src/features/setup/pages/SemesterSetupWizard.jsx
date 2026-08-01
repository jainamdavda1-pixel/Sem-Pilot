import React, { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { wizardSchema } from "../utils/schema";
import { Step1SemesterInfo } from "../components/Step1SemesterInfo";
import { Step2TimetableBuilder } from "../components/Step2TimetableBuilder";
import { Step3ReviewSubjects } from "../components/Step3ReviewSubjects";
import { Step3PreviousAttendance } from "../components/Step3PreviousAttendance";
import { Step4CalendarUpload } from "../components/Step4CalendarUpload";
import { Step5ImportantDates } from "../components/Step5ImportantDates";
import { Step6Preferences } from "../components/Step6Preferences";
import { Step7Summary } from "../components/Step7Summary";
import { Button } from "../../../shared/components/Button";
import { cn, syncFullDataToBackend } from "../../../shared/utils/utils";

export default function SemesterSetupWizard() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);

  // Initialize unified React Hook Form context
  const methods = useForm({
    resolver: zodResolver(wizardSchema),
    mode: "onBlur",
    defaultValues: {
      semesterInfo: {
        collegeName: "",
        degree: "",
        semester: "",
        academicYear: "",
        attendanceRequirement: 75,
        semesterStartDate: "",
        semesterEndDate: "",
      },
      subjects: [],
      timetableEntries: [],
      timetableRepeats: true,
      hasSemesterStarted: "No",
      pastLectures: [],
      calendarFile: null,
      dates: {
        midsemStart: "",
        midsemEnd: "",
        endsemStart: "",
        endsemEnd: "",
        holidays: [],
      },
      preferences: {
        prefMorning: "neutral",
        prefEvening: "neutral",
        prefLabs: "neutral",
        prefMaxContinuous: "3",
        prefAttendanceGoal: "75%",
        prefStrategy: "balanced",
      },
    },
  });

  const { trigger, handleSubmit } = methods;

  const steps = [
    { label: "Profile", fields: ["semesterInfo"] },
    { label: "Timetable", fields: ["timetableEntries", "timetableRepeats"] },
    { label: "Subjects", fields: ["subjects"] },
    { label: "Import Logs", fields: ["hasSemesterStarted", "pastLectures"] },
    { label: "Calendar", fields: ["calendarFile"] },
    { label: "Key Dates", fields: ["dates"] },
    { label: "Preferences", fields: ["preferences"] },
    { label: "Review", fields: [] },
  ];

  // Handles clicking the 'Next' action, triggering validation specifically for active step fields
  const handleNext = async () => {
    const fieldsToValidate = steps[activeStep].fields;
    let isValid = true;
    
    if (fieldsToValidate.length > 0) {
      isValid = await trigger(fieldsToValidate);
    }

    if (isValid) {
      // Transition Middleware: From Step 2 (Timetable) to Step 3 (Subjects Review)
      if (activeStep === 1) {
        const entries = methods.getValues("timetableEntries") || [];
        // Extract unique subject names
        const uniqueNames = [...new Set(entries.map((e) => e.subjectName).filter(Boolean))];
        const currentSubjects = methods.getValues("subjects") || [];

        // Map and prefill subject records
        const newSubjects = uniqueNames.map((name) => {
          const match = currentSubjects.find((s) => s.name?.toLowerCase() === name?.toLowerCase());
          if (match) {
            return match; // Keep existing reviews if they go back and forth
          }
          return {
            name,
            code: `${name.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
            facultyRating: 3,
            facultyStrictness: "medium",
            priority: "medium",
          };
        });

        methods.setValue("subjects", newSubjects);
      }

      setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  // On form completion, write to localStorage and redirect
  const onSubmit = (data) => {
    try {
      localStorage.setItem("sempilot_setup_data", JSON.stringify(data));
      
      // Save generated past attendance logs
      const pastLogs = (data.pastLectures || [])
        .filter((l) => l.status !== null && l.status !== undefined)
        .map((l) => ({
          id: `${l.date}-${l.subjectName}-${l.startTime}`,
          date: l.date,
          subjectName: l.subjectName,
          lectureType: l.lectureType,
          startTime: l.startTime,
          endTime: l.endTime,
          status: l.status,
          timestamp: Date.now(),
        }));

      localStorage.setItem("sempilot_attendance_logs", JSON.stringify(pastLogs));
      localStorage.setItem("sempilot_setup_complete", "true");
      syncFullDataToBackend(data, pastLogs);
      
      // Force trigger state reload or navigate
      navigate("/");
    } catch (err) {
      console.error("Failed to save semester configuration", err);
    }
  };

  const renderActiveStep = () => {
    switch (activeStep) {
      case 0:
        return <Step1SemesterInfo />;
      case 1:
        return <Step2TimetableBuilder />;
      case 2:
        return <Step3ReviewSubjects />;
      case 3:
        return <Step3PreviousAttendance />;
      case 4:
        return <Step4CalendarUpload />;
      case 5:
        return <Step5ImportantDates />;
      case 6:
        return <Step6Preferences />;
      case 7:
        return <Step7Summary />;
      default:
        return <Step1SemesterInfo />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between py-12 px-4 select-none">
      <div className="max-w-[840px] w-full mx-auto bg-white border border-slate-200 shadow-sm rounded-xl p-8 md:p-10 flex flex-col justify-between min-h-[600px]">
        <div>
          {/* Onboarding Header */}
          <div className="flex items-center gap-2 mb-8 select-none">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-white font-bold text-xs">
              S
            </div>
            <span className="font-semibold text-slate-800 tracking-tight text-sm">SemPilot Setup Wizard</span>
          </div>

          {/* Steps Progress Indicator */}
          <div className="flex items-center justify-between mb-10 overflow-x-auto pb-2 select-none border-b border-slate-100">
            {steps.map((step, idx) => {
              const isCompleted = activeStep > idx;
              const isActive = activeStep === idx;

              return (
                <div key={idx} className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1.5 py-2">
                    <span
                      className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors",
                        isCompleted && "bg-emerald-50 text-emerald-600 border-emerald-200/60",
                        isActive && "bg-primary text-white border-primary",
                        !isActive && !isCompleted && "bg-slate-50 text-slate-400 border-slate-200"
                      )}
                    >
                      {isCompleted ? "✓" : idx + 1}
                    </span>
                    <span
                      className={cn(
                        "text-xs font-semibold select-none",
                        isActive ? "text-slate-800" : "text-slate-400"
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <span className="text-slate-300 text-xs px-1 select-none">/</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Form Context wrapper */}
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {renderActiveStep()}
            </form>
          </FormProvider>
        </div>

        {/* Wizard Navigation Footer */}
        <div className="flex items-center justify-between pt-8 border-t border-slate-100 mt-10">
          <Button
            type="button"
            variant="ghost"
            onClick={handleBack}
            className={cn("h-9 text-slate-500 hover:text-slate-800", activeStep === 0 && "opacity-0 pointer-events-none")}
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back
          </Button>

          {activeStep < steps.length - 1 ? (
            <Button type="button" variant="primary" onClick={handleNext} className="h-9">
              Continue
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              onClick={handleSubmit(onSubmit)}
              className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4.5 h-4.5" />
              Finish Setup
            </Button>
          )}
        </div>
      </div>

      {/* Small credit footer */}
      <footer className="text-center mt-6 text-[10px] text-slate-400 font-medium tracking-wide select-none">
        SemPilot • Secured onboarding configuration
      </footer>
    </div>
  );
}

