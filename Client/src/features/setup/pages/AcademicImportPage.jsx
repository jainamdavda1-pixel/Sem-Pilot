import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { 
  Check, 
  AlertTriangle, 
  Sparkles,
  ArrowRight,
  FileSpreadsheet,
  RefreshCw,
  FolderOpen
} from "lucide-react";

import { Button } from "../../../shared/components/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../../shared/components/Card";
import { SectionHeader } from "../../../shared/components/SectionHeader";
import { useAcademicData } from "../../../shared/context/AcademicDataContext";

// Component imports
import UploadCard from "../components/import/UploadCard";
import ImportProgress from "../components/import/ImportProgress";
import WorkbookValidator from "../components/import/WorkbookValidator";
import SemesterPreview from "../components/import/SemesterPreview";
import FacultyPreview from "../components/import/FacultyPreview";
import SubjectPreview from "../components/import/SubjectPreview";
import LecturePreview from "../components/import/LecturePreview";
import HolidayPreview from "../components/import/HolidayPreview";
import ImportSummary from "../components/import/ImportSummary";

// Services & API imports
import { convertFileToBase64 } from "../services/excelParser";
import { validateWorkbookDataset } from "../services/workbookValidator";
import { generatePreviewDataset } from "../services/previewGenerator";
import { uploadWorkbookAPI, confirmImportAPI } from "../api/import.api";

export default function AcademicImportPage() {
  const navigate = useNavigate();
  const { refreshData } = useAcademicData();

  // Ingestion lifecycle steps: 1: Upload, 2: Loading/Parsing, 3: Preview/Edit, 4: Complete
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [successReport, setSuccessReport] = useState(null);
  const [stats, setStats] = useState(null);

  // Ingestion data state
  const [semester, setSemester] = useState(null);
  const [faculties, setFaculties] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [holidays, setHolidays] = useState([]);

  // Validation report state
  const [errors, setErrors] = useState([]);
  const [warnings, setWarnings] = useState([]);

  // Generate Excel Template on the fly
  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();

    const semesterWS = XLSX.utils.json_to_sheet([
      { Name: "Monsoon Semester 2026", AcademicYear: "2026-27", StartDate: "2026-07-21", EndDate: "2026-11-21", AttendanceRequirement: 75 }
    ]);
    XLSX.utils.book_append_sheet(wb, semesterWS, "Semester");

    const facultyWS = XLSX.utils.json_to_sheet([
      { FacultyName: "Dr. Sarah Miller", Department: "Mathematics", Email: "sarah@math.edu", Cabin: "M-302", Designation: "Professor", ShortName: "SM" },
      { FacultyName: "Prof. Alan Turing", Department: "Computer Science", Email: "alan@cs.edu", Cabin: "CS-101", Designation: "Associate Professor", ShortName: "AT" }
    ]);
    XLSX.utils.book_append_sheet(wb, facultyWS, "Faculty");

    const subjectsWS = XLSX.utils.json_to_sheet([
      { Code: "MTH101", SubjectName: "Mathematics", Type: "Theory", Credits: 4, FacultyName: "Dr. Sarah Miller" },
      { Code: "CSE101", SubjectName: "Computer Science", Type: "Theory", Credits: 4, FacultyName: "Prof. Alan Turing" }
    ]);
    XLSX.utils.book_append_sheet(wb, subjectsWS, "Subjects");

    const lecturesWS = XLSX.utils.json_to_sheet([
      { Day: "Monday", StartTime: "09:00", EndTime: "10:00", SubjectCode: "MTH101", FacultyName: "Dr. Sarah Miller", Room: "L-101", LectureType: "Theory", RepeatWeekly: "Yes" },
      { Day: "Tuesday", StartTime: "09:00", EndTime: "10:00", SubjectCode: "CSE101", FacultyName: "Prof. Alan Turing", Room: "CS-Lab1", LectureType: "Theory", RepeatWeekly: "Yes" },
      { Day: "Tuesday", StartTime: "10:00", EndTime: "12:00", SubjectCode: "CSE101", FacultyName: "Prof. Alan Turing", Room: "CS-Lab1", LectureType: "Lab", RepeatWeekly: "Yes" }
    ]);
    XLSX.utils.book_append_sheet(wb, lecturesWS, "Lectures");

    const holidaysWS = XLSX.utils.json_to_sheet([
      { Date: "2026-08-15", HolidayName: "Independence Day", Type: "National", AffectsAttendance: "Yes", Description: "National Holiday" }
    ]);
    XLSX.utils.book_append_sheet(wb, holidaysWS, "Holidays");

    XLSX.writeFile(wb, "Semester_Template.xlsx");
  };

  // Uploader Parser Trigger
  const handleFileSelect = async (file) => {
    setFileName(file.name);
    setCurrentStep(2);
    setLoading(true);

    try {
      // 1. Convert to Base64 format
      const base64 = await convertFileToBase64(file);

      // 2. Dispatch to backend Express parse endpoint
      const res = await uploadWorkbookAPI(base64);
      const parsed = res.data;

      // 3. Set Preview and format using generator sorting
      const formatted = generatePreviewDataset(parsed);
      setSemester(formatted.semester);
      setFaculties(formatted.faculties);
      setSubjects(formatted.subjects);
      setLectures(formatted.lectures);
      setHolidays(formatted.holidays);

      // 4. Set warnings & errors from server
      setErrors(parsed.errors || []);
      setWarnings(parsed.warnings || []);

      // 5. Store counts stats
      setStats({
        detectedSubjects: parsed.detectedSubjects || { THEORY: 0, PRACTICAL: 0, TUTORIAL: 0 },
        detectedLectureTypes: parsed.detectedLectureTypes || { THEORY: 0, PRACTICAL: 0, TUTORIAL: 0 },
        detectedWeekdays: parsed.detectedWeekdays || {}
      });

      setCurrentStep(3);
    } catch (err) {
      console.error("Workbook import parser error:", err);
      setErrors([`Spreadsheet upload failed: ${err.message}`]);
      setCurrentStep(1);
    } finally {
      setLoading(false);
    }
  };

  // Run client validation loop when preview grid entries are updated manually
  const triggerClientValidation = () => {
    if (!semester) return;
    const report = validateWorkbookDataset(semester, faculties, subjects, lectures, holidays);
    setErrors(report.errors);
    setWarnings(report.warnings);
  };

  useEffect(() => {
    triggerClientValidation();
  }, [semester, faculties, subjects, lectures, holidays]);

  // Modifiers triggers
  const handleUpdateFaculty = (idx, field, val) => {
    const copy = [...faculties];
    copy[idx][field] = val;
    setFaculties(copy);
  };

  const handleDeleteFaculty = (idx) => {
    setFaculties(faculties.filter((_, i) => i !== idx));
  };

  const handleAddFaculty = (fac) => {
    setFaculties([...faculties, fac]);
  };

  const handleUpdateSubject = (idx, field, val) => {
    const copy = [...subjects];
    copy[idx][field] = val;
    setSubjects(copy);
  };

  const handleDeleteSubject = (idx) => {
    setSubjects(subjects.filter((_, i) => i !== idx));
  };

  const handleAddSubject = (sub) => {
    setSubjects([...subjects, sub]);
  };

  const handleUpdateLecture = (idx, field, val) => {
    const copy = [...lectures];
    copy[idx][field] = val;
    setLectures(copy);
  };

  const handleDeleteLecture = (idx) => {
    setLectures(lectures.filter((_, i) => i !== idx));
  };

  const handleAddLecture = (lec) => {
    setLectures([...lectures, lec]);
  };

  const handleUpdateHoliday = (idx, field, val) => {
    const copy = [...holidays];
    copy[idx][field] = val;
    setHolidays(copy);
  };

  const handleDeleteHoliday = (idx) => {
    setHolidays(holidays.filter((_, i) => i !== idx));
  };

  const handleAddHoliday = (hol) => {
    setHolidays([...holidays, hol]);
  };

  // Commit validation checks to database
  const handleCommit = async () => {
    if (errors.length > 0) {
      alert("Please fix all blocking errors before submitting configurations.");
      return;
    }

    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("sempilot_user") || "null");
      const userId = user?.id || "default-user";

      const res = await confirmImportAPI({
        userId,
        semester,
        faculties,
        subjects,
        lectures,
        holidays
      });

      setSuccessReport(res.data);
      setCurrentStep(4);
      localStorage.setItem("sempilot_setup_complete", "true");
      
      // Reload active context configuration
      await refreshData();

      setTimeout(() => {
        navigate("/overview");
      }, 4000);
    } catch (err) {
      console.error("DB confirm transaction failure:", err);
      alert(`Database commit failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 select-none text-slate-800 font-sans">
      
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <SectionHeader 
          title="Academic Data Import" 
          description="Drag & Drop a single academic Excel workbook or parse sheets to ingest semesters, faculties, subjects, lectures, and holidays." 
        />
        {currentStep === 3 && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => { setCurrentStep(1); setSemester(null); }}
            className="text-xs gap-1.5 hover:bg-slate-50 text-slate-600 border-slate-200"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Upload New File
          </Button>
        )}
      </div>

      {/* Progress Indicators */}
      {currentStep < 4 && (
        <ImportProgress 
          currentStep={currentStep} 
          steps={["Upload Workbook", "Validate Columns", "Ingestion Preview"]} 
        />
      )}

      {/* In-Memory Loading Spinners Overlay */}
      {loading && currentStep === 2 && (
        <div className="flex flex-col items-center justify-center p-20 border border-slate-200/60 rounded-2xl bg-white shadow-xs gap-4 animate-pulse">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          <div className="text-center space-y-1">
            <span className="text-xs font-bold text-slate-700 block">Parsing Academic Sheet Structures...</span>
            <span className="text-[10px] text-slate-400 font-semibold block">Validating database indexes, overlaps, and headers</span>
          </div>
        </div>
      )}

      {/* Ingestion Steps Renderers */}
      {currentStep === 1 && (
        <UploadCard 
          onFileSelect={handleFileSelect} 
          onDownloadTemplate={handleDownloadTemplate} 
        />
      )}

      {currentStep === 3 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          {/* File uploaded details bar */}
          <div className="flex items-center gap-2 text-xs font-bold bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-3 text-slate-500">
            <FileSpreadsheet className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Active Sheet:</span>
            <span className="text-slate-800">{fileName}</span>
          </div>

          {/* Counts Stats Dashboard */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/50 border border-slate-200/60 rounded-2xl p-6 text-xs text-left">
              {/* Subjects Stats */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Detected Subjects</h4>
                <div className="space-y-1.5 font-semibold text-slate-700">
                  <div className="flex justify-between items-center bg-white px-3 py-2 rounded-lg border border-slate-100">
                    <span>Theory Courses</span>
                    <span className="font-extrabold text-slate-800">{stats.detectedSubjects.THEORY || 0}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white px-3 py-2 rounded-lg border border-slate-100">
                    <span>Practical/Labs</span>
                    <span className="font-extrabold text-slate-800">{stats.detectedSubjects.PRACTICAL || 0}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white px-3 py-2 rounded-lg border border-slate-100">
                    <span>Tutorials</span>
                    <span className="font-extrabold text-slate-800">{stats.detectedSubjects.TUTORIAL || 0}</span>
                  </div>
                </div>
              </div>

              {/* Lectures Stats */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Detected Lecture Types</h4>
                <div className="space-y-1.5 font-semibold text-slate-700">
                  <div className="flex justify-between items-center bg-white px-3 py-2 rounded-lg border border-slate-100">
                    <span>Theory Sessions</span>
                    <span className="font-extrabold text-slate-800">{stats.detectedLectureTypes.THEORY || 0}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white px-3 py-2 rounded-lg border border-slate-100">
                    <span>Practical/Lab Slots</span>
                    <span className="font-extrabold text-slate-800">{stats.detectedLectureTypes.PRACTICAL || 0}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white px-3 py-2 rounded-lg border border-slate-100">
                    <span>Tutorial Slots</span>
                    <span className="font-extrabold text-slate-800">{stats.detectedLectureTypes.TUTORIAL || 0}</span>
                  </div>
                </div>
              </div>

              {/* Weekdays Stats */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Weekly Distribution</h4>
                <div className="grid grid-cols-2 gap-1.5 font-semibold text-slate-700">
                  {Object.entries(stats.detectedWeekdays).map(([day, count]) => (
                    <div key={day} className="flex justify-between items-center bg-white px-2.5 py-1.5 rounded-lg border border-slate-100 text-[11px]">
                      <span className="truncate max-w-[70px]">{day}</span>
                      <span className="font-extrabold text-slate-800">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Validation card list */}
          <WorkbookValidator errors={errors} warnings={warnings} />

          {/* Stepper Grid Previews */}
          <div className="space-y-8">
            <SemesterPreview data={semester} onChange={setSemester} />
            <FacultyPreview data={faculties} onUpdate={handleUpdateFaculty} onDelete={handleDeleteFaculty} onAdd={handleAddFaculty} />
            <SubjectPreview data={subjects} faculties={faculties} onUpdate={handleUpdateSubject} onDelete={handleDeleteSubject} onAdd={handleAddSubject} />
            <LecturePreview 
              data={lectures} 
              subjects={subjects} 
              faculties={faculties} 
              onUpdate={handleUpdateLecture} 
              onDelete={handleDeleteLecture} 
              onAdd={handleAddLecture} 
              onSetLectures={setLectures} 
            />
            <HolidayPreview data={holidays} onUpdate={handleUpdateHoliday} onDelete={handleDeleteHoliday} onAdd={handleAddHoliday} />
          </div>

          {/* Trigger Commit Controls */}
          <div className="border-t border-slate-200/60 pt-6 flex justify-end">
            <Button
              variant="primary"
              onClick={handleCommit}
              disabled={errors.length > 0 || loading}
              className="gap-1.5 text-xs bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold tracking-wide uppercase shadow-lg shadow-emerald-500/20 py-5 px-6"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                  Saving records to Neon...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 shrink-0" />
                  Save and Sync Configuration
                </>
              )}
            </Button>
          </div>

        </div>
      )}

      {/* Completed Success Summary */}
      {currentStep === 4 && successReport && (
        <div className="flex justify-center p-8 animate-in zoom-in-95 duration-200">
          <ImportSummary report={successReport} />
        </div>
      )}

    </div>
  );
}
