import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../../../../shared/components/Card";
import { Button } from "../../../../shared/components/Button";

export default function HolidayPreview({ data, onUpdate, onDelete, onAdd }) {
  const [newHol, setNewHol] = useState({ name: "", date: "", type: "National", affectsAttendance: true, description: "" });

  const handleAdd = () => {
    if (!newHol.name || !newHol.date) {
      alert("Holiday Name and Date are required.");
      return;
    }
    onAdd(newHol);
    setNewHol({ name: "", date: "", type: "National", affectsAttendance: true, description: "" });
  };

  return (
    <Card className="border border-slate-200/60 shadow-xs bg-white text-left font-sans">
      <CardHeader className="py-3 border-b border-slate-100 bg-slate-50/30">
        <CardTitle className="text-xs uppercase font-extrabold text-slate-500">Holidays ({data.length})</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-xs">
            <thead className="bg-slate-50/50 font-bold text-slate-400">
              <tr>
                <th className="px-4 py-2 text-left">Holiday Name</th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Affects Attendance</th>
                <th className="px-4 py-2 text-left">Description</th>
                <th className="px-4 py-2 text-center w-12">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {data.map((h, idx) => (
                <tr key={idx}>
                  <td className="px-3 py-1.5">
                    <input 
                      type="text" 
                      value={h.name || ""} 
                      onChange={(e) => onUpdate(idx, "name", e.target.value)}
                      className="w-full p-1 border border-transparent hover:border-slate-200 focus:border-primary rounded bg-transparent focus:bg-white focus:outline-none text-xs font-semibold"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <input 
                      type="date" 
                      value={h.date || ""} 
                      onChange={(e) => onUpdate(idx, "date", e.target.value)}
                      className="w-full p-1 border border-transparent hover:border-slate-200 focus:border-primary rounded bg-transparent focus:bg-white focus:outline-none text-xs font-bold text-slate-600"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <input 
                      type="text" 
                      value={h.type || "National"} 
                      onChange={(e) => onUpdate(idx, "type", e.target.value)}
                      className="w-full p-1 border border-transparent hover:border-slate-200 focus:border-primary rounded bg-transparent focus:bg-white focus:outline-none text-xs"
                    />
                  </td>
                  <td className="px-3 py-1.5 font-medium">
                    <select
                      value={h.affectsAttendance ? "Yes" : "No"}
                      onChange={(e) => onUpdate(idx, "affectsAttendance", e.target.value === "Yes")}
                      className="p-1 border border-transparent hover:border-slate-200 focus:border-primary rounded bg-transparent focus:bg-white focus:outline-none text-xs font-semibold text-slate-600"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </td>
                  <td className="px-3 py-1.5">
                    <input 
                      type="text" 
                      value={h.description || ""} 
                      onChange={(e) => onUpdate(idx, "description", e.target.value)}
                      className="w-full p-1 border border-transparent hover:border-slate-200 focus:border-primary rounded bg-transparent focus:bg-white focus:outline-none text-xs"
                    />
                  </td>
                  <td className="px-4 py-1.5 text-center">
                    <button onClick={() => onDelete(idx)} className="text-red-500 hover:text-red-600">
                      <Trash2 className="w-3.5 h-3.5 mx-auto" />
                    </button>
                  </td>
                </tr>
              ))}
              {/* Insert Row */}
              <tr className="bg-slate-50/20 border-t border-slate-200/50">
                <td className="px-3 py-2">
                  <input 
                    type="text" 
                    value={newHol.name} 
                    onChange={(e) => setNewHol({ ...newHol, name: e.target.value })}
                    placeholder="New Holiday..." 
                    className="w-full p-1 border border-slate-200 rounded text-xs focus:outline-none focus:border-primary bg-white font-semibold"
                  />
                </td>
                <td className="px-3 py-2">
                  <input 
                    type="date" 
                    value={newHol.date} 
                    onChange={(e) => setNewHol({ ...newHol, date: e.target.value })}
                    className="w-full p-1 border border-slate-200 rounded text-xs focus:outline-none focus:border-primary bg-white text-slate-600 font-bold"
                  />
                </td>
                <td className="px-3 py-2">
                  <input 
                    type="text" 
                    value={newHol.type} 
                    onChange={(e) => setNewHol({ ...newHol, type: e.target.value })}
                    placeholder="Type..." 
                    className="w-full p-1 border border-slate-200 rounded text-xs focus:outline-none focus:border-primary bg-white"
                  />
                </td>
                <td className="px-3 py-2">
                  <select 
                    value={newHol.affectsAttendance ? "Yes" : "No"} 
                    onChange={(e) => setNewHol({ ...newHol, affectsAttendance: e.target.value === "Yes" })}
                    className="w-full p-1 border border-slate-200 rounded text-xs focus:outline-none focus:border-primary bg-white text-slate-600 font-semibold"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input 
                    type="text" 
                    value={newHol.description} 
                    onChange={(e) => setNewHol({ ...newHol, description: e.target.value })}
                    placeholder="Description..." 
                    className="w-full p-1 border border-slate-200 rounded text-xs focus:outline-none focus:border-primary bg-white"
                  />
                </td>
                <td className="px-4 py-2 text-center">
                  <Button variant="outline" size="sm" onClick={handleAdd} className="p-1 rounded text-primary border-primary/20 hover:bg-primary/5">
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
