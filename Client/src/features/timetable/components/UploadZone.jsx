import React, { useState, useRef } from "react";
import { UploadCloud, FileText, X, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { Button } from "../../../shared/components/Button";
import { cn } from "../../../shared/utils/utils";
import { parseExcelTimetable, parseJSONTimetable } from "../utils/parser";

export function UploadZone({ onUploadSuccess, className }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null); // null or 0-100
  const [parsedFile, setParsedFile] = useState(null); // { name, size }
  const [errors, setErrors] = useState([]);
  
  const fileInputRef = useRef(null);

  // File type validations
  const validateFileType = (file) => {
    const name = file.name.toLowerCase();
    return (
      name.endsWith(".xlsx") ||
      name.endsWith(".xls") ||
      name.endsWith(".csv") ||
      name.endsWith(".json")
    );
  };

  const processFile = async (file) => {
    setErrors([]);
    setUploadProgress(0);
    setParsedFile({ name: file.name, size: file.size });

    // Progress simulation
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 25;
      });
    }, 100);

    const reader = new FileReader();

    reader.onload = async (e) => {
      let result = { data: [], errors: [] };
      const name = file.name.toLowerCase();

      if (name.endsWith(".json")) {
        const text = e.target.result;
        result = parseJSONTimetable(text);
      } else {
        const buffer = e.target.result;
        result = await parseExcelTimetable(buffer);
      }

      // Short delay to let progress animation feel premium
      setTimeout(() => {
        setUploadProgress(null);
        if (result.errors && result.errors.length > 0) {
          setErrors(result.errors);
          setParsedFile(null);
        } else {
          onUploadSuccess(result.data, file.name);
        }
      }, 500);
    };

    if (name.endsWith(".json")) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFileType(file)) {
        processFile(file);
      } else {
        setErrors(["Unsupported file type. Please upload a .xlsx, .xls, .csv, or .json file."]);
      }
    }
  };

  const handleFileBrowse = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFileType(file)) {
        processFile(file);
      } else {
        setErrors(["Unsupported file type. Please upload a .xlsx, .xls, .csv, or .json file."]);
      }
    }
  };

  const triggerBrowse = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const resetUpload = () => {
    setParsedFile(null);
    setErrors([]);
    setUploadProgress(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={cn("space-y-6 max-w-2xl mx-auto text-left", className)}>
      
      {/* Upload Box */}
      {!parsedFile && uploadProgress === null ? (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={triggerBrowse}
          className={cn(
            "border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 select-none group",
            isDragActive 
              ? "border-primary bg-blue-50/20" 
              : "border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/20"
          )}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileBrowse}
            accept=".xlsx,.xls,.csv,.json"
            className="hidden"
          />

          <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:border-primary/30 transition-colors duration-150">
            <UploadCloud className="w-5.5 h-5.5" />
          </div>

          <h3 className="mt-5 text-sm font-semibold text-slate-800">
            📅 Upload Timetable
          </h3>
          <p className="mt-1.5 text-xs text-slate-500">
            Upload your semester timetable in Excel or JSON format.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            <span>• .xlsx</span>
            <span>• .xls</span>
            <span>• .csv</span>
            <span>• .json</span>
          </div>
        </div>
      ) : (
        /* Progress loader & processing view */
        <div className="border border-slate-200 bg-white rounded-xl p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">
                {parsedFile?.name}
              </p>
              <p className="text-[10px] text-slate-400 font-medium">
                {parsedFile ? `${(parsedFile.size / 1024).toFixed(1)} KB` : "Reading..."}
              </p>
            </div>
            
            {uploadProgress === null && (
              <button
                type="button"
                onClick={resetUpload}
                className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {uploadProgress !== null && (
            <div className="space-y-2">
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-100"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider text-right">
                Parsing schedule... {uploadProgress}%
              </p>
            </div>
          )}
        </div>
      )}

      {/* Validation Error Banner */}
      {errors.length > 0 && (
        <div className="p-4 border border-red-100 bg-red-50/30 rounded-xl space-y-2">
          <div className="flex items-center gap-2 pb-2 border-b border-red-100/50">
            <AlertTriangle className="w-4.5 h-4.5 text-red-500 shrink-0" />
            <h4 className="text-xs font-bold text-red-800 uppercase tracking-wider">
              Timetable Validation Errors
            </h4>
          </div>
          <ul className="list-disc pl-4 space-y-1 text-xs text-red-700 max-h-48 overflow-y-auto font-medium">
            {errors.map((err, idx) => (
              <li key={idx} className="leading-relaxed">
                {err}
              </li>
            ))}
          </ul>
          <div className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs border-red-200 text-red-700 bg-white hover:bg-red-50 hover:border-red-300"
              onClick={resetUpload}
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Try Again
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
export default UploadZone;
