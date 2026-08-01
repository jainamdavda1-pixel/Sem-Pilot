import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../../../../shared/components/Card";
import { Button } from "../../../../shared/components/Button";
import { Badge } from "../../../../shared/components/Badge";

export default function SubjectPreview({ data, faculties, onUpdate, onDelete, onAdd }) {
  const [newSub, setNewSub] = useState({ code: "", name: "", type: "THEORY", credits: 3, facultyName: "" });

  const handleAdd = () => {
    if (!newSub.code || !newSub.name) {
      alert("Subject Code and Name are required.");
      return;
    }
    onAdd(newSub);
    setNewSub({ code: "", name: "", type: "THEORY", credits: 3, facultyName: "" });
  };

  return (
    <Card className="border border-slate-200/60 shadow-xs bg-white text-left font-sans">
      <CardHeader className="py-3 border-b border-slate-100 bg-slate-50/30">
        <CardTitle className="text-xs uppercase font-extrabold text-slate-500">Subjects catalog ({data.length})</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-xs">
            <thead className="bg-slate-50/50 font-bold text-slate-400">
              <tr>
                <th className="px-4 py-2 text-left">Code</th>
                <th className="px-4 py-2 text-left">Subject Name</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Credits</th>
                <th className="px-4 py-2 text-left">Faculty Assigned</th>
                <th className="px-4 py-2 text-center w-12">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {data.map((s, idx) => (
                <tr key={idx}>
                  <td className="px-3 py-1.5 font-bold text-slate-800">
                    <input 
                      type="text" 
                      value={s.code || ""} 
                      onChange={(e) => onUpdate(idx, "code", e.target.value)}
                      className="w-full p-1 border border-transparent hover:border-slate-200 focus:border-primary rounded bg-transparent focus:bg-white focus:outline-none text-xs font-bold text-slate-800"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <input 
                      type="text" 
                      value={s.name || ""} 
                      onChange={(e) => onUpdate(idx, "name", e.target.value)}
                      className="w-full p-1 border border-transparent hover:border-slate-200 focus:border-primary rounded bg-transparent focus:bg-white focus:outline-none text-xs"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <select 
                      value={String(s.type || "THEORY").toUpperCase()} 
                      onChange={(e) => onUpdate(idx, "type", e.target.value)}
                      className="p-1 border border-transparent hover:border-slate-200 focus:border-primary rounded bg-transparent focus:bg-white focus:outline-none text-xs"
                    >
                      <option value="THEORY">Theory</option>
                      <option value="LAB">Lab</option>
                      <option value="TUTORIAL">Tutorial</option>
                      <option value="WORKSHOP">Workshop</option>
                      <option value="PRACTICAL">Practical</option>
                      <option value="SEMINAR">Seminar</option>
                      <option value="PROJECT">Project</option>
                    </select>
                  </td>
                  <td className="px-3 py-1.5">
                    <input 
                      type="number" 
                      value={s.credits || 3} 
                      onChange={(e) => onUpdate(idx, "credits", parseInt(e.target.value, 10) || 3)}
                      className="w-16 p-1 border border-transparent hover:border-slate-200 focus:border-primary rounded bg-transparent focus:bg-white focus:outline-none text-xs"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <select
                      value={s.facultyName || ""}
                      onChange={(e) => onUpdate(idx, "facultyName", e.target.value)}
                      className="w-full p-1 border border-transparent hover:border-slate-200 focus:border-primary rounded bg-transparent focus:bg-white focus:outline-none text-xs"
                    >
                      <option value="">Select Faculty</option>
                      {faculties.map((f, i) => (
                        <option key={i} value={f.name}>{f.name}</option>
                      ))}
                    </select>
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
                    value={newSub.code} 
                    onChange={(e) => setNewSub({ ...newSub, code: e.target.value })}
                    placeholder="New Code..." 
                    className="w-full p-1 border border-slate-200 rounded text-xs focus:outline-none focus:border-primary bg-white font-bold"
                  />
                </td>
                <td className="px-3 py-2">
                  <input 
                    type="text" 
                    value={newSub.name} 
                    onChange={(e) => setNewSub({ ...newSub, name: e.target.value })}
                    placeholder="Subject Name..." 
                    className="w-full p-1 border border-slate-200 rounded text-xs focus:outline-none focus:border-primary bg-white"
                  />
                </td>
                <td className="px-3 py-2">
                  <select 
                    value={newSub.type} 
                    onChange={(e) => setNewSub({ ...newSub, type: e.target.value })}
                    className="w-full p-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:border-primary bg-white"
                  >
                    <option value="THEORY">Theory</option>
                    <option value="LAB">Lab</option>
                    <option value="TUTORIAL">Tutorial</option>
                    <option value="WORKSHOP">Workshop</option>
                    <option value="PRACTICAL">Practical</option>
                    <option value="SEMINAR">Seminar</option>
                    <option value="PROJECT">Project</option>
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input 
                    type="number" 
                    value={newSub.credits} 
                    onChange={(e) => setNewSub({ ...newSub, credits: parseInt(e.target.value, 10) || 3 })}
                    className="w-full p-1 border border-slate-200 rounded text-xs focus:outline-none focus:border-primary bg-white"
                  />
                </td>
                <td className="px-3 py-2">
                  <select
                    value={newSub.facultyName}
                    onChange={(e) => setNewSub({ ...newSub, facultyName: e.target.value })}
                    className="w-full p-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:border-primary bg-white"
                  >
                    <option value="">Select Faculty</option>
                    {faculties.map((f, i) => (
                      <option key={i} value={f.name}>{f.name}</option>
                    ))}
                  </select>
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
