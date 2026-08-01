import React, { useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { UploadCloud, FileText, Image as ImageIcon, X, AlertCircle } from "lucide-react";
import { Button } from "../../../shared/components/Button";
import { cn } from "../../../shared/utils/utils";

export function Step4CalendarUpload() {
  const { setValue, watch } = useFormContext();
  const calendarFile = watch("calendarFile");
  
  const [activeTab, setActiveTab] = useState("pdf"); // 'pdf' | 'image' | 'skip'
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Store serializable metadata in the form state
      setValue("calendarFile", {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      });
    }
  };

  const handleRemoveFile = () => {
    setValue("calendarFile", null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-slate-800 tracking-tight">Academic Calendar</h3>
        <p className="text-xs text-slate-500">Provide your official university academic calendar so we can align term timelines.</p>
      </div>

      {/* Tabs */}
      <div className="flex border border-slate-200 rounded-md p-0.5 bg-slate-50 max-w-md select-none">
        <button
          type="button"
          onClick={() => { setActiveTab("pdf"); handleRemoveFile(); }}
          className={cn(
            "flex-1 h-8 text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition-all cursor-pointer",
            activeTab === "pdf" ? "bg-white text-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.03)] border border-slate-200/50" : "text-slate-500 hover:text-slate-800"
          )}
        >
          <FileText className="w-3.5 h-3.5" />
          PDF Calendar
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab("image"); handleRemoveFile(); }}
          className={cn(
            "flex-1 h-8 text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition-all cursor-pointer",
            activeTab === "image" ? "bg-white text-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.03)] border border-slate-200/50" : "text-slate-500 hover:text-slate-800"
          )}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          Calendar Image
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab("skip"); handleRemoveFile(); }}
          className={cn(
            "flex-1 h-8 text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition-all cursor-pointer",
            activeTab === "skip" ? "bg-white text-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.03)] border border-slate-200/50" : "text-slate-500 hover:text-slate-800"
          )}
        >
          Skip for now
        </button>
      </div>

      {/* Upload Blocks */}
      <div className="max-w-xl">
        {activeTab !== "skip" ? (
          <div className="space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept={activeTab === "pdf" ? "application/pdf" : "image/*"}
              className="hidden"
            />
            
            {!calendarFile ? (
              <div
                onClick={triggerFileInput}
                className="border-2 border-dashed border-slate-200 rounded-lg p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary hover:bg-slate-50/40 transition-all select-none group"
              >
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors border border-slate-200/50">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div className="mt-4 space-y-1.5">
                  <p className="text-xs font-semibold text-slate-700">
                    Click to select your {activeTab === "pdf" ? "PDF file" : "Image file"}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Drag and drop file here, max size 10MB
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 p-4 border border-slate-200/80 bg-white rounded-lg shadow-sm">
                <div className="w-10 h-10 rounded bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-200/50 shrink-0">
                  {activeTab === "pdf" ? (
                    <FileText className="w-5 h-5 text-red-500" />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-blue-500" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">
                    {calendarFile.name}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {(calendarFile.size / 1024).toFixed(1)} KB • Ready for sync
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-start gap-3.5 p-5 border border-amber-100 bg-amber-50/10 rounded-lg text-left">
            <AlertCircle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-xs font-semibold text-amber-800 block">
                No Academic Calendar Sync
              </span>
              <span className="text-xs text-amber-700/80 leading-normal block">
                Skipping this step means you will have to add exam dates and term schedules manually later. You can always upload this calendar file from your profile settings.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default Step4CalendarUpload;
