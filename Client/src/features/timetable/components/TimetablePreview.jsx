import React, { useState } from "react";
import { DndContext, useDraggable, useDroppable, DragOverlay } from "@dnd-kit/core";
import { Clock, MapPin, User, AlertTriangle, Plus, X, Trash2, Undo2, Redo2, RotateCcw } from "lucide-react";
import { cn } from "../../../shared/utils/utils";
import { Button } from "../../../shared/components/Button";

// Helper: Convert string to hash value
const getHashCode = (str) => {
  let hash = 0;
  if (!str) return hash;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

// Helper: Pick a color scheme based on subject name & lecture type
export const getSubjectPastel = (subjectName, lectureType = "THEORY") => {
  const schemes = [
    // 0: Blue
    {
      theory: "bg-blue-50/70 border-blue-200 text-blue-800 border-l-4 border-l-blue-500 rounded-r-lg rounded-l-[2px]",
      lab: "bg-blue-600 border-blue-700 text-white border-l-4 border-l-blue-900 rounded-lg shadow-sm font-semibold",
      tutorial: "bg-blue-100 border-blue-300 text-blue-900 border-l-4 border-l-blue-600 rounded-lg"
    },
    // 1: Emerald
    {
      theory: "bg-emerald-50/70 border-emerald-200 text-emerald-800 border-l-4 border-l-emerald-500 rounded-r-lg rounded-l-[2px]",
      lab: "bg-emerald-600 border-emerald-700 text-white border-l-4 border-l-emerald-900 rounded-lg shadow-sm font-semibold",
      tutorial: "bg-emerald-100 border-emerald-300 text-emerald-900 border-l-4 border-l-emerald-600 rounded-lg"
    },
    // 2: Violet
    {
      theory: "bg-violet-50/70 border-violet-200 text-violet-800 border-l-4 border-l-violet-500 rounded-r-lg rounded-l-[2px]",
      lab: "bg-violet-600 border-violet-700 text-white border-l-4 border-l-violet-900 rounded-lg shadow-sm font-semibold",
      tutorial: "bg-violet-100 border-violet-300 text-violet-900 border-l-4 border-l-violet-600 rounded-lg"
    },
    // 3: Amber
    {
      theory: "bg-amber-50/70 border-amber-200 text-amber-900 border-l-4 border-l-amber-500 rounded-r-lg rounded-l-[2px]",
      lab: "bg-amber-600 border-amber-700 text-white border-l-4 border-l-amber-900 rounded-lg shadow-sm font-semibold",
      tutorial: "bg-amber-100 border-amber-300 text-amber-950 border-l-4 border-l-amber-600 rounded-lg"
    },
    // 4: Rose
    {
      theory: "bg-rose-50/70 border-rose-200 text-rose-800 border-l-4 border-l-rose-500 rounded-r-lg rounded-l-[2px]",
      lab: "bg-rose-600 border-rose-700 text-white border-l-4 border-l-rose-900 rounded-lg shadow-sm font-semibold",
      tutorial: "bg-rose-100 border-rose-300 text-rose-900 border-l-4 border-l-rose-600 rounded-lg"
    },
    // 5: Sky
    {
      theory: "bg-sky-50/70 border-sky-200 text-sky-800 border-l-4 border-l-sky-500 rounded-r-lg rounded-l-[2px]",
      lab: "bg-sky-600 border-sky-700 text-white border-l-4 border-l-sky-900 rounded-lg shadow-sm font-semibold",
      tutorial: "bg-sky-100 border-sky-300 text-sky-900 border-l-4 border-l-sky-600 rounded-lg"
    }
  ];
  
  if (!subjectName) return schemes[0].theory;
  const hash = getHashCode(subjectName);
  const index = hash % schemes.length;
  const matchScheme = schemes[index];
  
  const typeClean = String(lectureType || "THEORY").trim().toUpperCase();
  if (typeClean === "LAB") return matchScheme.lab;
  if (typeClean === "TUTORIAL") return matchScheme.tutorial;
  return matchScheme.theory;
};

// Helper: Convert time string to minutes
const parseTimeToMinutes = (str) => {
  if (!str) return 0;
  const parts = String(str).split(":");
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
};

// Helper: Format minutes to HH:MM
const formatMinutesToTime = (mins) => {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

// Droppable Grid Cell Component
function GridCell({ day, slot, onClick }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `grid-${day}-${slot.start}-${slot.end}`,
    data: { day, start: slot.start, end: slot.end }
  });

  return (
    <div 
      ref={setNodeRef} 
      onClick={onClick}
      className={cn(
        "w-full h-full min-h-[100px] border border-slate-100/50 transition-all flex items-center justify-center group cursor-pointer relative",
        isOver ? "bg-primary/10 border-primary/20" : "bg-slate-50/5 hover:bg-slate-50/20"
      )}
    >
      <Plus className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

// Draggable Lecture Card Component
function DraggableLectureCard({ lecture, index, onClick, onResizeStart, conflicts, isOverlay }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `draggable-${index}`,
    data: { lecture, index }
  });

  const TIME_SLOTS = [
    { start: "09:00", end: "10:00" },
    { start: "10:00", end: "11:00" },
    { start: "11:00", end: "12:00" },
    { start: "12:00", end: "13:00" },
    { start: "13:00", end: "14:00" },
    { start: "14:00", end: "15:00" },
    { start: "15:00", end: "16:00" },
    { start: "16:00", end: "17:00" }
  ];

  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const colIdx = DAYS.indexOf(String(lecture.day || "").trim()) === -1 
    ? 2 
    : DAYS.indexOf(String(lecture.day || "").trim()) + 2;

  const sIdx = TIME_SLOTS.findIndex(s => s.start === lecture.startTime);
  const eIdx = TIME_SLOTS.findIndex(s => s.end === lecture.endTime);

  const startRow = sIdx !== -1 ? sIdx + 2 : 2;
  const endRow = eIdx !== -1 ? eIdx + 3 : startRow + 1;

  const gridStyle = isOverlay ? undefined : {
    gridColumn: colIdx,
    gridRow: `${startRow} / ${endRow}`,
    zIndex: isDragging ? 5 : 10,
    opacity: isDragging ? 0.3 : 1
  };

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 999
  } : undefined;

  const combinedStyle = { ...gridStyle, ...style };

  const typeClean = String(lecture.lectureType || "THEORY").trim().toUpperCase();

  return (
    <div 
      ref={setNodeRef} 
      style={combinedStyle} 
      {...listeners} 
      {...attributes} 
      onClick={onClick}
      className={cn(
        "p-3 rounded-xl border select-none cursor-grab active:cursor-grabbing text-left font-sans group relative flex flex-col justify-between transition-shadow hover:shadow-md",
        conflicts.length > 0 
          ? "border-red-300 bg-red-50/90 text-red-900 hover:bg-red-50" 
          : getSubjectPastel(lecture.subjectName, lecture.lectureType)
      )}
    >
      <div className="relative z-10 space-y-1.5 pointer-events-auto w-full">
        
        {/* Card Header */}
        <div className="flex justify-between items-start gap-1">
          <div className="space-y-0.5 min-w-0">
            <span className={cn(
              "text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider",
              typeClean === "LAB" ? "bg-blue-800 text-white" : "bg-white/60 border border-current text-inherit"
            )}>
              {lecture.lectureType || "THEORY"}
            </span>
            <h4 className="text-xs font-bold tracking-tight mt-1 truncate">
              {lecture.subjectName}
            </h4>
          </div>
          
          {conflicts.length > 0 && (
            <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5 animate-pulse" />
          )}
        </div>

        {/* Details list */}
        <div className="space-y-0.5 text-[9px] opacity-85 font-medium leading-none">
          {lecture.subjectCode && (
            <div className="font-bold opacity-75">{lecture.subjectCode}</div>
          )}
          <div className="flex items-center gap-0.5 mt-1">
            <Clock className="w-2.5 h-2.5 shrink-0 opacity-70" />
            <span>{lecture.startTime} - {lecture.endTime}</span>
          </div>
          {lecture.room && (
            <div className="flex items-center gap-0.5">
              <MapPin className="w-2.5 h-2.5 shrink-0 opacity-70" />
              <span>Room: {lecture.room}</span>
            </div>
          )}
          {lecture.faculty && (
            <div className="flex items-center gap-0.5">
              <User className="w-2.5 h-2.5 shrink-0 opacity-70" />
              <span className="truncate max-w-[90px]">{lecture.faculty}</span>
            </div>
          )}
        </div>

        {/* Collision Warning lists */}
        {conflicts.length > 0 && (
          <div className="pt-1.5 border-t border-red-200/50 mt-1 flex items-start gap-1 text-[8px] text-red-700 font-bold leading-tight">
            <div className="space-y-0.5">
              {conflicts.map((c, i) => (
                <span key={i} className="block">• {c}</span>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Resize Bottom edge handler */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-2.5 cursor-ns-resize bg-transparent hover:bg-slate-500/10 transition-all z-30 pointer-events-auto"
        onPointerDown={(e) => onResizeStart(e, index)}
        onMouseDown={(e) => onResizeStart(e, index)}
      />
    </div>
  );
}

export function TimetablePreview({ entries = [], onUpdateEntries, className }) {
  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  
  const TIME_SLOTS = [
    { label: "09:00 - 10:00", start: "09:00", end: "10:00" },
    { label: "10:00 - 11:00", start: "10:00", end: "11:00" },
    { label: "11:00 - 12:00", start: "11:00", end: "12:00" },
    { label: "12:00 - 13:00", start: "12:00", end: "13:00" },
    { label: "13:00 - 14:00", start: "13:00", end: "14:00" },
    { label: "14:00 - 15:00", start: "14:00", end: "15:00" },
    { label: "15:00 - 16:00", start: "15:00", end: "16:00" },
    { label: "16:00 - 17:00", start: "16:00", end: "17:00" }
  ];

  // History stack for Undo/Redo/Reset
  const [historyPast, setHistoryPast] = useState([]);
  const [historyFuture, setHistoryFuture] = useState([]);
  const [originalEntries] = useState(() => JSON.parse(JSON.stringify(entries)));

  // Overlay preview state
  const [activeId, setActiveId] = useState(null);

  const [isMobile, setIsMobile] = useState(false);
  const [activeTabDay, setActiveTabDay] = useState("Monday");

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Edit/Add modal dialog state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add" or "edit"
  const [editIndex, setEditIndex] = useState(null);
  
  const [subName, setSubName] = useState("");
  const [subCode, setSubCode] = useState("");
  const [facName, setFacName] = useState("");
  const [roomNum, setRoomNum] = useState("");
  const [lecType, setLecType] = useState("THEORY");
  const [targetDay, setTargetDay] = useState("Monday");
  const [startT, setStartT] = useState("09:00");
  const [endT, setEndT] = useState("10:00");

  const updateParentWithHistory = (newEntries) => {
    if (!onUpdateEntries) return;
    setHistoryPast([...historyPast, JSON.parse(JSON.stringify(entries))]);
    setHistoryFuture([]);
    onUpdateEntries(newEntries);
  };

  const handleUndo = () => {
    if (historyPast.length === 0 || !onUpdateEntries) return;
    const previous = historyPast[historyPast.length - 1];
    setHistoryPast(historyPast.slice(0, -1));
    setHistoryFuture([JSON.parse(JSON.stringify(entries)), ...historyFuture]);
    onUpdateEntries(previous);
  };

  const handleRedo = () => {
    if (historyFuture.length === 0 || !onUpdateEntries) return;
    const next = historyFuture[0];
    setHistoryFuture(historyFuture.slice(1));
    setHistoryPast([...historyPast, JSON.parse(JSON.stringify(entries))]);
    onUpdateEntries(next);
  };

  const handleReset = () => {
    if (!onUpdateEntries) return;
    updateParentWithHistory(JSON.parse(JSON.stringify(originalEntries)));
  };

  // Drag and Drop triggers
  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || !onUpdateEntries) return;

    const dragIdx = parseInt(active.id.split("-")[1], 10);
    const targetLec = entries[dragIdx];
    if (!targetLec) return;

    const { day, start } = over.data.current;

    // Calculate duration in minutes to preserve it
    const duration = parseTimeToMinutes(targetLec.endTime) - parseTimeToMinutes(targetLec.startTime);
    const newStartMins = parseTimeToMinutes(start);
    const newEndMins = newStartMins + duration;

    const updated = [...entries];
    updated[dragIdx] = {
      ...updated[dragIdx],
      day: day,
      startTime: start,
      endTime: formatMinutesToTime(newEndMins)
    };
    updateParentWithHistory(updated);
  };

  // Dynamic Pointer Drag Resizer
  const handleResizeStart = (e, index) => {
    e.preventDefault();
    e.stopPropagation();

    const startY = e.clientY;
    const targetLec = entries[index];
    const origEndMins = parseTimeToMinutes(targetLec.endTime);

    const handleMouseMove = (moveEvent) => {
      // 120px = 60 minutes -> 2px per minute
      const deltaY = moveEvent.clientY - startY;
      const deltaMins = Math.round(deltaY / 2);
      
      // Quantize to 15-minute blocks
      const quantize = 15;
      const totalDelta = Math.round(deltaMins / quantize) * quantize;

      const newEndMins = origEndMins + totalDelta;
      const startMins = parseTimeToMinutes(targetLec.startTime);

      // Constrain minimum duration: 30 mins; maximum end: 17:00
      const minEnd = startMins + 30;
      const maxEnd = parseTimeToMinutes("17:00");
      const finalEndMins = Math.max(minEnd, Math.min(maxEnd, newEndMins));

      const updated = [...entries];
      updated[index] = {
        ...updated[index],
        endTime: formatMinutesToTime(finalEndMins)
      };
      
      // Trigger live updates
      if (onUpdateEntries) {
        onUpdateEntries(updated);
      }
    };

    const handleMouseUp = () => {
      // Push final state to undo stack
      setHistoryPast([...historyPast, JSON.parse(JSON.stringify(entries))]);
      setHistoryFuture([]);
      
      document.removeEventListener("pointermove", handleMouseMove);
      document.removeEventListener("pointerup", handleMouseUp);
    };

    document.addEventListener("pointermove", handleMouseMove);
    document.addEventListener("pointerup", handleMouseUp);
  };

  // Cell / Card click triggers
  const handleCardClick = (lec, idx, e) => {
    e.stopPropagation();
    setModalMode("edit");
    setEditIndex(idx);

    setSubName(lec.subjectName || "");
    setSubCode(lec.subjectCode || lec.code || "");
    setFacName(lec.faculty || lec.facultyName || "");
    setRoomNum(lec.room || "");
    setLecType(lec.lectureType || "THEORY");
    setTargetDay(lec.day || "Monday");
    setStartT(lec.startTime || "09:00");
    setEndT(lec.endTime || "10:00");

    setIsModalOpen(true);
  };

  const handleCellClick = (day, slot) => {
    setModalMode("add");
    setEditIndex(null);

    setSubName("");
    setSubCode("");
    setFacName("");
    setRoomNum("");
    setLecType("THEORY");
    setTargetDay(day);
    setStartT(slot.start);
    setEndT(slot.end);

    setIsModalOpen(true);
  };

  const handleSaveModal = () => {
    if (!subName) return;

    const newLec = {
      subjectName: subName,
      subjectCode: subCode,
      code: subCode,
      faculty: facName,
      facultyName: facName,
      room: roomNum,
      lectureType: lecType,
      day: targetDay,
      startTime: startT,
      endTime: endT
    };

    const updated = [...entries];
    if (modalMode === "edit" && editIndex !== null) {
      updated[editIndex] = newLec;
    } else {
      updated.push(newLec);
    }

    updateParentWithHistory(updated);
    setIsModalOpen(false);
  };

  const handleDeleteEntry = () => {
    if (editIndex === null) return;
    const updated = entries.filter((_, i) => i !== editIndex);
    updateParentWithHistory(updated);
    setIsModalOpen(false);
  };

  // Overlap Validation warning scanner
  const getLectureConflicts = (lec, idx) => {
    const conflicts = [];
    const start = parseTimeToMinutes(lec.startTime);
    const end = parseTimeToMinutes(lec.endTime);
    const day = String(lec.day || "").toUpperCase().trim();

    if (!day || start >= end) return conflicts;

    entries.forEach((other, oIdx) => {
      if (idx === oIdx) return;
      const oStart = parseTimeToMinutes(other.startTime);
      const oEnd = parseTimeToMinutes(other.endTime);
      const oDay = String(other.day || "").toUpperCase().trim();

      if (day !== oDay || oStart >= oEnd) return;

      const overlaps = start < oEnd && end > oStart;
      if (overlaps) {
        if (lec.room && other.room && lec.room.trim() === other.room.trim()) {
          conflicts.push(`Room collision: "${lec.room}"`);
        }
        if ((lec.faculty || lec.facultyName) && (other.faculty || other.facultyName) && 
            String(lec.faculty || lec.facultyName).trim().toLowerCase() === String(other.faculty || other.facultyName).trim().toLowerCase()) {
          conflicts.push(`Faculty collision: "${lec.faculty || lec.facultyName}"`);
        }
        if (lec.subjectName === other.subjectName) {
          conflicts.push(`Subject overlap: "${lec.subjectName}"`);
        }
      }
    });

    return conflicts;
  };

  const activeIndex = activeId ? parseInt(activeId.split("-")[1], 10) : null;
  const activeLecture = activeIndex !== null ? entries[activeIndex] : null;

  return (
    <div className={cn("border border-slate-200/60 rounded-2xl bg-white shadow-sm overflow-hidden select-none space-y-4 p-4", className)}>
      
      {/* Calendar Toolbar Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
        <div className="space-y-0.5 text-left">
          <h4 className="text-xs uppercase font-extrabold text-slate-500">Google Calendar Schedule Board ({entries.length})</h4>
          <p className="text-[10px] text-slate-400 font-medium">Drag events or grab the bottom edge to resize durations.</p>
        </div>
        
        {/* Undo controls list */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleUndo} 
            disabled={historyPast.length === 0}
            className="text-[10px] h-8 px-2.5 gap-1.5 border-slate-200 bg-white"
          >
            <Undo2 className="w-3.5 h-3.5" />
            Undo
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRedo} 
            disabled={historyFuture.length === 0}
            className="text-[10px] h-8 px-2.5 gap-1.5 border-slate-200 bg-white"
          >
            <Redo2 className="w-3.5 h-3.5" />
            Redo
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleReset}
            className="text-[10px] h-8 px-2.5 gap-1.5 border-slate-200 bg-white text-slate-600 hover:text-slate-800"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </Button>
        </div>
      </div>

      {isMobile ? (
        <div className="space-y-4">
          {/* Day selection tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-4 px-4 select-none scrollbar-none border-b border-slate-100">
            {DAYS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setActiveTabDay(d)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border",
                  activeTabDay === d
                    ? "bg-primary text-white border-primary"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                )}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Timeline List of Lectures */}
          <div className="space-y-3">
            {(() => {
              const dayLectures = entries
                .filter((e) => String(e.day || "").toLowerCase() === activeTabDay.toLowerCase())
                .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));

              if (dayLectures.length === 0) {
                return (
                  <div className="py-12 border border-dashed border-slate-200 bg-white rounded-xl text-center p-6 space-y-3">
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mx-auto text-sm select-none">
                      💤
                    </div>
                    <div className="space-y-1">
                      <h5 className="text-xs font-bold text-slate-800">No Lectures Scheduled</h5>
                      <p className="text-[10px] text-slate-500 max-w-xs mx-auto">
                        Nothing scheduled for {activeTabDay}. Rest up or self-study!
                      </p>
                    </div>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {dayLectures.map((lec) => {
                    const idx = entries.indexOf(lec);
                    const conflicts = getLectureConflicts(lec, idx);
                    const typeClean = String(lec.lectureType || "THEORY").trim().toUpperCase();

                    return (
                      <div 
                        key={idx}
                        onClick={(e) => handleCardClick(lec, idx, e)}
                        className={cn(
                          "p-4 rounded-xl border text-left font-sans flex flex-col justify-between shadow-sm cursor-pointer hover:shadow-md transition-shadow relative overflow-hidden",
                          conflicts.length > 0 
                            ? "border-red-300 bg-red-50 text-red-900" 
                            : getSubjectPastel(lec.subjectName, lec.lectureType)
                        )}
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-start gap-2">
                            <div className="space-y-1">
                              <span className={cn(
                                "text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider",
                                typeClean === "LAB" ? "bg-blue-800 text-white" : "bg-white/60 border border-current text-inherit"
                              )}>
                                {lec.lectureType || "THEORY"}
                              </span>
                              <h4 className="text-sm font-bold text-slate-800 tracking-tight mt-1.5">
                                {lec.subjectName}
                              </h4>
                            </div>
                            {conflicts.length > 0 && (
                              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5 animate-pulse" />
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[10px] opacity-90 pt-1.5 border-t border-slate-100/50">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="font-semibold">{lec.startTime} - {lec.endTime}</span>
                            </div>
                            {lec.room && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>Room: {lec.room}</span>
                              </div>
                            )}
                            {(lec.faculty || lec.facultyName) && (
                              <div className="flex items-center gap-1 col-span-2">
                                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>Faculty: {lec.faculty || lec.facultyName}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            <div className="pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full h-10 border-dashed border-slate-300 text-slate-500 hover:bg-slate-50 hover:text-slate-700 flex items-center justify-center gap-1.5"
                onClick={() => handleCellClick(activeTabDay, TIME_SLOTS[0])}
              >
                <Plus className="w-4 h-4" /> Add Lecture to {activeTabDay}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="overflow-x-auto">
            <div 
              className="min-w-[900px] border border-slate-100 rounded-2xl bg-slate-50/20"
              style={{
                display: "grid",
                gridTemplateColumns: "120px repeat(6, 1fr)",
                gridTemplateRows: "45px repeat(8, 120px)",
                gap: "1px",
                backgroundColor: "#f8fafc"
              }}
            >
              {/* Header day labels */}
              <div className="bg-slate-50/80 font-bold text-slate-500 text-[10px] uppercase tracking-wider flex items-center justify-center border-b border-r border-slate-200/50">
                Time
              </div>
              {DAYS.map((d, i) => (
                <div key={i} className="bg-slate-50/80 font-bold text-slate-500 text-[10px] uppercase tracking-wider flex items-center justify-center border-b border-slate-200/50">
                  {d}
                </div>
              ))}

              {/* Ingestion Slot Cells */}
              {TIME_SLOTS.map((slot, sIdx) => {
                const rowIdx = sIdx + 2;
                return (
                  <React.Fragment key={sIdx}>
                    
                    {/* Time columns labels */}
                    <div 
                      className="bg-white font-bold text-slate-500 text-[10px] flex items-center justify-center border-r border-slate-200/50"
                      style={{
                        gridColumn: 1,
                        gridRow: rowIdx
                      }}
                    >
                      {slot.label}
                    </div>

                    {/* Empty droppables dropzones */}
                    {DAYS.map((day, dIdx) => {
                      const colIdx = dIdx + 2;
                      return (
                        <div
                          key={dIdx}
                          style={{
                            gridColumn: colIdx,
                            gridRow: rowIdx,
                            zIndex: 1
                          }}
                        >
                          <GridCell 
                            day={day} 
                            slot={slot} 
                            onClick={() => handleCellClick(day, slot)}
                          />
                        </div>
                      );
                    })}

                  </React.Fragment>
                );
              })}

              {/* Draggable overlays layer cards */}
              {entries.map((lec, idx) => (
                <DraggableLectureCard
                  key={idx}
                  lecture={lec}
                  index={idx}
                  onClick={(e) => handleCardClick(lec, idx, e)}
                  onResizeStart={handleResizeStart}
                  conflicts={getLectureConflicts(lec, idx)}
                  isOverlay={false}
                />
              ))}

            </div>
          </div>

          <DragOverlay>
            {activeLecture ? (
              <DraggableLectureCard
                lecture={activeLecture}
                index={activeIndex}
                conflicts={getLectureConflicts(activeLecture, activeIndex)}
                isOverlay={true}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Dynamic Popover Modal Editor */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans text-left">
          <div className="bg-white border border-slate-200 shadow-md rounded-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal header */}
            <div className="h-12 border-b border-slate-100 flex items-center justify-between px-4 bg-slate-50/50">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider font-sans">
                {modalMode === "edit" ? "Modify Timetable Lecture" : "Schedule New Lecture"}
              </span>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded p-1 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content fields */}
            <div className="p-4 space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Subject Name</label>
                <input 
                  type="text" 
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary font-medium"
                  placeholder="e.g. Machine Learning"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Subject Code</label>
                  <input 
                    type="text" 
                    value={subCode}
                    onChange={(e) => setSubCode(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary font-medium"
                    placeholder="e.g. CSE-101"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Lecture Type</label>
                  <select
                    value={lecType}
                    onChange={(e) => setLecType(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary bg-white font-medium"
                  >
                    <option value="THEORY">Theory</option>
                    <option value="LAB">Lab</option>
                    <option value="TUTORIAL">Tutorial</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Room</label>
                  <input 
                    type="text" 
                    value={roomNum}
                    onChange={(e) => setRoomNum(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary font-medium"
                    placeholder="e.g. B-302"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Faculty</label>
                  <input 
                    type="text" 
                    value={facName}
                    onChange={(e) => setFacName(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary font-medium"
                    placeholder="e.g. Dr. Holt"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Day</label>
                  <select
                    value={targetDay}
                    onChange={(e) => setTargetDay(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-[10px] focus:outline-none focus:border-primary bg-white font-semibold"
                  >
                    {DAYS.map((d, i) => <option key={i} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Start Time</label>
                  <select
                    value={startT}
                    onChange={(e) => setStartT(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-[10px] focus:outline-none focus:border-primary bg-white font-semibold"
                  >
                    {TIME_SLOTS.map((s, i) => <option key={i} value={s.start}>{s.start}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">End Time</label>
                  <select
                    value={endT}
                    onChange={(e) => setEndT(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-[10px] focus:outline-none focus:border-primary bg-white font-semibold"
                  >
                    {TIME_SLOTS.map((s, i) => <option key={i} value={s.end}>{s.end}</option>)}
                  </select>
                </div>
              </div>

              {/* Action Buttons footer */}
              <div className="flex gap-2 pt-2 justify-end border-t border-slate-100 mt-4">
                {modalMode === "edit" && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleDeleteEntry}
                    className="text-red-600 hover:text-red-700 bg-red-50/50 hover:bg-red-50 border-red-200/50 h-8"
                  >
                    Delete
                  </Button>
                )}
                <Button 
                  size="sm" 
                  onClick={handleSaveModal}
                  disabled={!subName}
                  className="h-8 font-semibold"
                >
                  Save Entry
                </Button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default TimetablePreview;
