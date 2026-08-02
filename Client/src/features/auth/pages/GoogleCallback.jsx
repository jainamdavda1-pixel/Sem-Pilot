import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

export function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("exchanging"); // "exchanging" | "success" | "error"
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setStatus("error");
      setErrorMsg("Authorization code not found in redirect URL.");
      return;
    }

    const exchangeCode = async () => {
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001";
      try {
        const userObj = JSON.parse(localStorage.getItem("sempilot_user") || "null");
        const userId = userObj?.id || "default-user";
        const response = await fetch(`${API_BASE}/api/v1/classroom/callback?userId=${userId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ code })
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to exchange Google OAuth code.");
        }

        setStatus("success");
        setTimeout(() => {
          navigate("/assignments");
        }, 1500);
      } catch (err) {
        setStatus("error");
        setErrorMsg(err.message || "An unexpected error occurred during link authorization.");
      }
    };

    exchangeCode();
  }, [searchParams, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 font-sans p-6">
      <div className="bg-white border border-slate-100 rounded-2xl p-8 max-w-md w-full shadow-lg text-center space-y-6">
        {status === "exchanging" && (
          <>
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
            <div className="space-y-1.5">
              <h2 className="text-base font-bold text-slate-800">Linking Google Classroom</h2>
              <p className="text-xs text-slate-500">
                Authorizing secure credentials and configuring credentials. This will only take a moment.
              </p>
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-base font-bold text-slate-800">Connection Successful!</h2>
              <p className="text-xs text-slate-500">
                Google Classroom account mapped successfully. Redirecting you to assignments board...
              </p>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-base font-bold text-slate-800">Authorization Failed</h2>
              <p className="text-xs text-rose-600 font-medium">{errorMsg}</p>
              <p className="text-[10px] text-slate-400">
                Please double-check your Google Cloud client credentials or verify that Google Classroom permissions are authorized.
              </p>
            </div>
            <button
              onClick={() => navigate("/assignments")}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition w-full cursor-pointer"
            >
              Back to Assignments
            </button>
          </>
        )}
      </div>
    </div>
  );
}
