import React, { useState } from "react";
import { DndContext, useDraggable, useDroppable, DragOverlay } from "@dnd-kit/core";
import { Plus, Trash2, AlertTriangle, Undo2, Redo2, RotateCcw } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../../../../shared/components/Card";
import { Button } from "../../../../shared/components/Button";

// Helper: Add hours/minutes to HH:MM time string
const addMinutes = (timeStr, mins) => {
  if (!timeStr) return "";
  const parts = String(timeStr).split(':');
  if (parts.length < 2) return timeStr;
  let h = parseInt(parts[0], 10);
  let m = parseInt(parts[1], 10);
  const total = h * 60 + m + mins;
  const newH = Math.floor(total / 60) % 24;
  const newM = total % 60;
  return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
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

// Droppable Cell Component
function GridCell({ day, slot }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `cell-${day}-${slot.start}-${slot.end}`,
    data: { day, start: slot.start, end: slot.end }
  });

  return (
    <div 
      ref={setNodeRef} 
      className={`w-full h-full min-h-[100px] border border-slate-100/50 transition-all ${
        isOver 
          ? "bg-primary/10 border-primary/20" 
          : "bg-slate-50/10 hover:bg-slate-50/20"
      }`}
    />
  );
}

// Draggable Lecture Card Component
function DraggableLectureCard({ lecture, index, subjects, faculties, onUpdate, onDelete, conflicts, isOverlay }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `lecture-${index}`,
    data: { lecture, index }
  });

  // Calculate CSS grid properties based on start and end times
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

  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const colIdx = (() => {
    const idx = DAYS.findIndex(
      (d) => d.toUpperCase() === String(lecture.weekday || "").trim().toUpperCase()
    );
    return idx === -1 ? 2 : idx + 2;
  })();

  const sIdx = TIME_SLOTS.findIndex(s => s.start === lecture.startTime);
  const eIdx = TIME_SLOTS.findIndex(s => s.end === lecture.endTime);

  const startRow = sIdx !== -1 ? sIdx + 2 : 2;
  const endRow = eIdx !== -1 ? eIdx + 3 : startRow + 1; // Span at least 1 hour row

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

  const [isEditing, setIsEditing] = useState(false);

  return (
    <div 
      ref={setNodeRef} 
      style={combinedStyle} 
      {...listeners} 
      {...attributes} 
      className={`p-3 rounded-xl border bg-white shadow-sm select-none cursor-grab active:cursor-grabbing text-left font-sans group relative flex flex-col justify-between ${
        conflicts.length > 0 
          ? "border-amber-300 bg-amber-50/10 hover:bg-amber-50/20" 
          : "border-slate-200/60"
      }`}
    >
      <div className="relative z-10 space-y-2 pointer-events-auto w-full">
        
        {/* Card Header details */}
        <div className="flex justify-between items-start gap-1">
          <div className="space-y-0.5">
            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase tracking-wide">
              {lecture.lectureType || "Theory"}
            </span>
            <h4 className="text-xs font-extrabold text-slate-800 tracking-tight mt-1 truncate">
              {lecture.subjectCode}
            </h4>
          </div>
          
          <div 
            className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="text-[9px] font-bold text-slate-400 hover:text-slate-600"
            >
              {isEditing ? "Done" : "Edit"}
            </button>
            <button 
              onClick={() => onDelete(index)} 
              className="text-red-400 hover:text-red-500"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Dynamic inline editor form */}
        {isEditing ? (
          <div 
            className="space-y-1.5 pt-1 border-t border-slate-100 mt-1.5 z-20"
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <select
              value={lecture.subjectCode || ""}
              onChange={(e) => onUpdate(index, "subjectCode", e.target.value)}
              className="w-full p-1 border border-slate-200 rounded text-[10px] focus:outline-none focus:border-primary bg-white font-medium"
            >
              <option value="">Select Code</option>
              {subjects.map((s, i) => (
                <option key={i} value={s.code}>{s.code}</option>
              ))}
            </select>
            <input 
              type="text" 
              placeholder="Room..." 
              value={lecture.room || ""} 
              onChange={(e) => onUpdate(index, "room", e.target.value)}
              className="w-full p-1 border border-slate-200 rounded text-[10px] focus:outline-none focus:border-primary font-medium"
            />
            <select
              value={lecture.lectureType || "Theory"}
              onChange={(e) => onUpdate(index, "lectureType", e.target.value)}
              className="w-full p-1 border border-slate-200 rounded text-[10px] focus:outline-none focus:border-primary bg-white font-medium"
            >
              <option value="THEORY">Theory</option>
              <option value="LAB">Lab</option>
              <option value="TUTORIAL">Tutorial</option>
              <option value="WORKSHOP">Workshop</option>
              <option value="PRACTICAL">Practical</option>
              <option value="SEMINAR">Seminar</option>
              <option value="PROJECT">Project</option>
            </select>
            <select
              value={lecture.facultyName || ""}
              onChange={(e) => onUpdate(index, "facultyName", e.target.value)}
              className="w-full p-1 border border-slate-200 rounded text-[10px] focus:outline-none focus:border-primary bg-white font-medium"
            >
              <option value="">Select Faculty</option>
              {faculties.map((f, i) => (
                <option key={i} value={f.name}>{f.name}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="space-y-0.5 text-[9px] text-slate-500 font-medium">
            <div className="flex justify-between">
              <span>Time:</span>
              <span className="font-semibold text-slate-700">{lecture.startTime} - {lecture.endTime}</span>
            </div>
            {lecture.room && (
              <div className="flex justify-between">
                <span>Room:</span>
                <span className="font-semibold text-slate-700">{lecture.room}</span>
              </div>
            )}
            {lecture.facultyName && (
              <div className="flex justify-between">
                <span>Faculty:</span>
                <span className="font-semibold text-slate-700 truncate max-w-[80px]">{lecture.facultyName}</span>
              </div>
            )}
          </div>
        )}

        {/* Warnings Collisions lists */}
        {conflicts.length > 0 && (
          <div className="pt-1 border-t border-amber-200 mt-1 flex items-start gap-1 text-[8px] text-amber-600 font-semibold leading-normal">
            <AlertTriangle className="w-2.5 h-2.5 shrink-0 text-amber-500 mt-0.5" />
            <div className="space-y-0.5">
              {conflicts.map((c, i) => (
                <span key={i} className="block truncate max-w-[120px]">• {c}</span>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function LecturePreview({ data, subjects, faculties, onUpdate, onDelete, onAdd, onSetLectures }) {
  // Undo/Redo history stack
  const [historyPast, setHistoryPast] = useState([]);
  const [historyFuture, setHistoryFuture] = useState([]);
  const [originalData] = useState(() => JSON.parse(JSON.stringify(data)));
  
  // Drag overlay state
  const [activeId, setActiveId] = useState(null);

  const updateWithHistory = (newLectures) => {
    setHistoryPast([...historyPast, JSON.parse(JSON.stringify(data))]);
    setHistoryFuture([]);
    onSetLectures(newLectures);
  };

  const handleUndo = () => {
    if (historyPast.length === 0) return;
    const previous = historyPast[historyPast.length - 1];
    setHistoryPast(historyPast.slice(0, -1));
    setHistoryFuture([JSON.parse(JSON.stringify(data)), ...historyFuture]);
    onSetLectures(previous);
  };

  const handleRedo = () => {
    if (historyFuture.length === 0) return;
    const next = historyFuture[0];
    setHistoryFuture(historyFuture.slice(1));
    setHistoryPast([...historyPast, JSON.parse(JSON.stringify(data))]);
    onSetLectures(next);
  };

  const handleReset = () => {
    updateWithHistory(JSON.parse(JSON.stringify(originalData)));
  };

  // Drag and Drop handlers
  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const dragIdx = parseInt(active.id.split("-")[1], 10);
    const targetLec = data[dragIdx];
    if (!targetLec) return;

    const { day, start } = over.data.current;

    // Calculate duration to preserve it
    const origStart = parseTimeToMinutes(targetLec.startTime);
    const origEnd = parseTimeToMinutes(targetLec.endTime);
    const duration = origEnd - origStart;

    const newStart = parseTimeToMinutes(start);
    const newEnd = newStart + duration;

    const updated = [...data];
    updated[dragIdx] = {
      ...updated[dragIdx],
      weekday: day.toUpperCase(),
      startTime: start,
      endTime: formatMinutesToTime(newEnd)
    };
    updateWithHistory(updated);
  };

  const handleUpdate = (idx, field, val) => {
    const updated = [...data];
    const prevItem = updated[idx];
    const item = { ...prevItem, [field]: val };

    if (field === 'lectureType' && val === 'LAB' && prevItem.lectureType !== 'LAB') {
      // Newly converted to LAB: default to a 2-hour block as a starting point only.
      item.endTime = addMinutes(item.startTime, 120);
    } else if (field === 'startTime') {
      // Preserve the lecture's existing duration when its start time moves,
      // instead of silently collapsing/stretching it.
      const origStart = parseTimeToMinutes(prevItem.startTime);
      const origEnd = parseTimeToMinutes(prevItem.endTime);
      const duration = origEnd > origStart ? origEnd - origStart : 60;
      item.endTime = formatMinutesToTime(parseTimeToMinutes(val) + duration);
    }

    updated[idx] = item;
    updateWithHistory(updated);
  };

  const handleDelete = (idx) => {
    const updated = data.filter((_, i) => i !== idx);
    updateWithHistory(updated);
  };

  const handleAdd = (day, slot) => {
    const defaultSub = subjects[0];
    const isLab = defaultSub?.type === 'LAB';
    const resolvedEnd = isLab ? addMinutes(slot.start, 120) : slot.end;

    const newLec = {
      subjectCode: defaultSub?.code || "",
      weekday: day.toUpperCase(),
      startTime: slot.start,
      endTime: resolvedEnd,
      room: "",
      lectureType: defaultSub?.type || "THEORY",
      repeatWeekly: true,
      facultyName: ""
    };
    updateWithHistory([...data, newLec]);
  };

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

  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  // Overlap warnings analyzer
  const getLectureConflicts = (lec, idx) => {
    const conflicts = [];
    const start = parseTimeToMinutes(lec.startTime);
    const end = parseTimeToMinutes(lec.endTime);
    const day = lec.weekday?.toUpperCase().trim();

    if (!day || start >= end) return conflicts;

    data.forEach((other, oIdx) => {
      if (idx === oIdx) return;
      const oStart = parseTimeToMinutes(other.startTime);
      const oEnd = parseTimeToMinutes(other.endTime);
      const oDay = other.weekday?.toUpperCase().trim();

      if (day !== oDay || oStart >= oEnd) return;

      const overlaps = start < oEnd && end > oStart;
      if (overlaps) {
        if (lec.room && other.room && lec.room.trim() === other.room.trim()) {
          conflicts.push(`Room conflict`);
        }
        if (lec.facultyName && other.facultyName && lec.facultyName.trim().toLowerCase() === other.facultyName.trim().toLowerCase()) {
          conflicts.push(`Faculty conflict`);
        }
        if (lec.subjectCode === other.subjectCode) {
          conflicts.push(`Subject overlap`);
        }
      }
    });

    return conflicts;
  };

  const activeIndex = activeId ? parseInt(activeId.split("-")[1], 10) : null;
  const activeLecture = activeIndex !== null ? data[activeIndex] : null;

  return (
    <Card className="border border-slate-200/60 shadow-sm bg-white text-left font-sans">
      <CardHeader className="py-3.5 border-b border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="space-y-0.5">
          <CardTitle className="text-xs uppercase font-extrabold text-slate-500">Weekly Lecture Board ({data.length})</CardTitle>
          <p className="text-[10px] text-slate-400 font-medium">Drag events to schedule. Dragging preserves duration and type.</p>
        </div>
        
        {/* History actions controllers */}
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
      </CardHeader>
      
      <CardContent className="p-4">
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="overflow-x-auto">
            <div 
              className="min-w-[1000px] border border-slate-100 rounded-xl bg-slate-50/30"
              style={{
                display: "grid",
                gridTemplateColumns: "120px repeat(7, 1fr)",
                gridTemplateRows: "45px repeat(8, 120px)",
                gap: "1px",
                backgroundColor: "#f8fafc"
              }}
            >
              
              {/* Header Cells */}
              <div className="bg-slate-50/80 font-extrabold text-slate-500 text-[10px] uppercase tracking-wider flex items-center justify-center border-b border-r border-slate-200/50">
                Time Slot
              </div>
              {DAYS.map((d, i) => (
                <div key={i} className="bg-slate-50/80 font-extrabold text-slate-500 text-[10px] uppercase tracking-wider flex items-center justify-center border-b border-slate-200/50">
                  {d}
                </div>
              ))}

              {/* Backing Grid Droppables */}
              {TIME_SLOTS.map((slot, sIdx) => {
                const rowIdx = sIdx + 2;
                return (
                  <React.Fragment key={sIdx}>
                    
                    {/* Time Label column cell */}
                    <div 
                      className="bg-white font-bold text-slate-500 text-[10px] flex items-center justify-center border-r border-slate-200/50"
                      style={{
                        gridColumn: 1,
                        gridRow: rowIdx
                      }}
                    >
                      {slot.label}
                    </div>

                    {/* Droppable grid slots */}
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
                          <GridCell day={day} slot={slot} />
                        </div>
                      );
                    })}

                  </React.Fragment>
                );
              })}

              {/* Draggable Cards Overlay layers */}
              {data.map((lec, idx) => (
                <DraggableLectureCard
                  key={idx}
                  lecture={lec}
                  index={idx}
                  subjects={subjects}
                  faculties={faculties}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
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
                subjects={subjects}
                faculties={faculties}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                conflicts={getLectureConflicts(activeLecture, activeIndex)}
                isOverlay={true}
              />
            ) : null}
          </DragOverlay>

        </DndContext>
      </CardContent>
    </Card>
  );
}
