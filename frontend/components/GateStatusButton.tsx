"use client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { triggerDeviceControl } from "@/services/deviceService";

export default function GateStatusButton() {
  const { user, token } = useAuth(); 
  const [gateState, setGateState] = useState<"Ouvert" | "Fermé">("Fermé");
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    const activeToken = token || (typeof window !== "undefined" ? localStorage.getItem("smart-site-token") : null);

    if (user === undefined && !activeToken) return; 

    if (!activeToken) {
      console.warn("⚠️ GateStatusButton: Postponing SSE connection. No token found.");
      return;
    }

    const streamUrl = `${API_URL}/devices/stream?token=${encodeURIComponent(activeToken)}`;
    const eventSource = new EventSource(streamUrl);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // 🔍 DEBUG LOG: Look at your browser console to see exactly what fields are arriving!
        console.log("📥 SSE Received Telemetry Data:", data);
        
        // Target your fake gate helper input_boolean
        // NOTE: Verify in your console logs if the backend sends it exactly as 'input_boolean.fakegate' 
        // or if it nested inside an object property (like data.entity_id or data.entity)
        if (data.entityId === "input_boolean.fakegate" || data.entity_id === "input_boolean.fakegate") {
          const targetState = data.state || data.newState;
          setGateState(targetState === "on" ? "Ouvert" : "Fermé");
        }
      } catch (err) {
        console.error("Failed to parse live telemetry:", err);
      }
    };

    eventSource.onerror = () => {
      console.warn("SSE stream link dropped. Reconnecting...");
    };

    return () => eventSource.close();
  }, [user, token]);

const handleAction = async () => {
  if (isPending) return;
  setIsPending(true);
  
  try {
    // 1. Dispatch the trigger to the backend
    await triggerDeviceControl("portail-principal", "toggle");
    
    // ❌ REMOVED the manual setGateState(...) toggle line here!
    // This stops the frontend from fighting or getting ahead of the incoming SSE broadcast event.
    
  } catch (err) {
    console.error("Failed to execute trigger:", err);
  } finally {
    // 2. Clear the loading spinner cleanly so the user can click it again if needed
    setIsPending(false);
  }
};

  const isOuvert = gateState === "Ouvert";

  return (
    <div className="w-full flex flex-col gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl">
      
      {/* 📐 Header row with Title on left, Badge on the right */}
      <div className="flex items-center justify-between w-full">
        <h2 className="text-base font-semibold text-slate-200">Portail Principal</h2>
        
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors duration-300
          ${isOuvert 
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
            : "bg-rose-500/10 border-rose-500/30 text-rose-400"
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isOuvert ? "bg-emerald-400 animate-pulse" : "bg-rose-500"}`} />
          {gateState}
        </div>
      </div>

      {/* Action Trigger Button */}
      <button
        onClick={handleAction}
        disabled={isPending}
        className={`w-full px-4 py-2.5 rounded-lg font-medium text-sm transition-all text-center border
          ${isPending 
            ? "bg-amber-500/10 text-amber-400 border-amber-500/20 cursor-wait" 
            : "bg-blue-600 hover:bg-blue-500 text-white border-blue-700"
          }`}
      >
        {isPending ? "Action en cours..." : "Actionner le portail"}
      </button>
      
    </div>
  );
}