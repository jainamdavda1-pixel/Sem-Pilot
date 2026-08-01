import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../../../../shared/components/Card";
import { Button } from "../../../../shared/components/Button";

export default function FacultyPreview({ data, onUpdate, onDelete, onAdd }) {
  const [newFac, setNewFac] = useState({ name: "", department: "", email: "", cabin: "", designation: "", shortName: "" });

  const handleAdd = () => {
    if (!newFac.name) {
      alert("Faculty Name is required.");
      return;
    }
    onAdd(newFac);
    setNewFac({ name: "", department: "", email: "", cabin: "", designation: "", shortName: "" });
  };

  return (
    <Card className="border border-slate-200/60 shadow-xs bg-white text-left font-sans">
      <CardHeader className="py-3 border-b border-slate-100 bg-slate-50/30">
        <CardTitle className="text-xs uppercase font-extrabold text-slate-500">Faculty Roster ({data.length})</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-xs">
            <thead className="bg-slate-50/50 font-bold text-slate-400">
              <tr>
                <th className="px-4 py-2 text-left">Faculty Name</th>
                <th className="px-4 py-2 text-left">Department</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Cabin</th>
                <th className="px-4 py-2 text-left">Designation</th>
                <th className="px-4 py-2 text-left">Short Name</th>
                <th className="px-4 py-2 text-center w-12">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {data.map((f, idx) => (
                <tr key={idx}>
                  <td className="px-3 py-1.5">
                    <input 
                      type="text" 
                      value={f.name || ""} 
                      onChange={(e) => onUpdate(idx, "name", e.target.value)}
                      className="w-full p-1 border border-transparent hover:border-slate-200 focus:border-primary rounded bg-transparent focus:bg-white focus:outline-none text-xs font-semibold"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <input 
                      type="text" 
                      value={f.department || ""} 
                      onChange={(e) => onUpdate(idx, "department", e.target.value)}
                      className="w-full p-1 border border-transparent hover:border-slate-200 focus:border-primary rounded bg-transparent focus:bg-white focus:outline-none text-xs"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <input 
                      type="text" 
                      value={f.email || ""} 
                      onChange={(e) => onUpdate(idx, "email", e.target.value)}
                      className="w-full p-1 border border-transparent hover:border-slate-200 focus:border-primary rounded bg-transparent focus:bg-white focus:outline-none text-xs"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <input 
                      type="text" 
                      value={f.cabin || ""} 
                      onChange={(e) => onUpdate(idx, "cabin", e.target.value)}
                      className="w-full p-1 border border-transparent hover:border-slate-200 focus:border-primary rounded bg-transparent focus:bg-white focus:outline-none text-xs"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <input 
                      type="text" 
                      value={f.designation || ""} 
                      onChange={(e) => onUpdate(idx, "designation", e.target.value)}
                      className="w-full p-1 border border-transparent hover:border-slate-200 focus:border-primary rounded bg-transparent focus:bg-white focus:outline-none text-xs"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <input 
                      type="text" 
                      value={f.shortName || ""} 
                      onChange={(e) => onUpdate(idx, "shortName", e.target.value)}
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
                    value={newFac.name} 
                    onChange={(e) => setNewFac({ ...newFac, name: e.target.value })}
                    placeholder="New Faculty..." 
                    className="w-full p-1 border border-slate-200 rounded text-xs focus:outline-none focus:border-primary bg-white"
                  />
                </td>
                <td className="px-3 py-2">
                  <input 
                    type="text" 
                    value={newFac.department} 
                    onChange={(e) => setNewFac({ ...newFac, department: e.target.value })}
                    placeholder="Department..." 
                    className="w-full p-1 border border-slate-200 rounded text-xs focus:outline-none focus:border-primary bg-white"
                  />
                </td>
                <td className="px-3 py-2">
                  <input 
                    type="text" 
                    value={newFac.email} 
                    onChange={(e) => setNewFac({ ...newFac, email: e.target.value })}
                    placeholder="Email..." 
                    className="w-full p-1 border border-slate-200 rounded text-xs bg-white"
                  />
                </td>
                <td className="px-3 py-2">
                  <input 
                    type="text" 
                    value={newFac.cabin} 
                    onChange={(e) => setNewFac({ ...newFac, cabin: e.target.value })}
                    placeholder="Cabin..." 
                    className="w-full p-1 border border-slate-200 rounded text-xs bg-white"
                  />
                </td>
                <td className="px-3 py-2">
                  <input 
                    type="text" 
                    value={newFac.designation} 
                    onChange={(e) => setNewFac({ ...newFac, designation: e.target.value })}
                    placeholder="Designation..." 
                    className="w-full p-1 border border-slate-200 rounded text-xs bg-white"
                  />
                </td>
                <td className="px-3 py-2">
                  <input 
                    type="text" 
                    value={newFac.shortName} 
                    onChange={(e) => setNewFac({ ...newFac, shortName: e.target.value })}
                    placeholder="Short Name..." 
                    className="w-full p-1 border border-slate-200 rounded text-xs bg-white"
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
