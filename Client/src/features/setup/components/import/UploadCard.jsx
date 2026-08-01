import React, { useState } from "react";
import { FileSpreadsheet, Upload, Download } from "lucide-react";
import { Button } from "../../../../shared/components/Button";

export default function UploadCard({ onFileSelect, onDownloadTemplate }) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) onFileSelect(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) onFileSelect(file);
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-2xl p-12 transition-all flex flex-col items-center justify-center text-center space-y-6 ${
        isDragOver 
          ? "border-primary bg-primary/5 scale-[0.99] shadow-inner" 
          : "border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50"
      }`}
    >
      <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-emerald-500 shrink-0">
        <FileSpreadsheet className="w-8 h-8" />
      </div>

      <div className="space-y-1.5 max-w-sm">
        <h3 className="text-sm font-bold text-slate-800">Upload your academic workbook</h3>
        <p className="text-xs text-slate-500 leading-normal">
          Drag & drop your formatted Excel (.xlsx, .xls) or CSV template file here, or browse local files.
        </p>
      </div>

      <div className="flex gap-3">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onDownloadTemplate}
          className="text-xs border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold gap-1.5 shadow-xs"
        >
          <Download className="w-3.5 h-3.5" />
          Download Excel Template
        </Button>

        <label className="inline-flex cursor-pointer">
          <input 
            type="file" 
            accept=".xlsx, .xls, .csv" 
            className="hidden" 
            onChange={handleFileChange} 
          />
          <span className="inline-flex items-center justify-center rounded-md font-semibold text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring select-none bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 h-9 px-4 gap-1.5">
            <Upload className="w-3.5 h-3.5" />
            Browse Files
          </span>
        </label>
      </div>
    </div>
  );
}
