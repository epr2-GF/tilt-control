"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from "react";

import { apiFetch } from "@/lib/api";
import { useAuth } from "./AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";


type DeviceStates = {
  [entityId: string]: string;
};


type DeviceContextType = {
  states: DeviceStates;
};


const DeviceContext = createContext<DeviceContextType | undefined>(
  undefined
);



export function DeviceProvider({
  children,
}: {
  children: ReactNode;
}) {

  const { user, token } = useAuth();

  const [states, setStates] = useState<DeviceStates>({});


  // Prevent duplicate SSE connections
  const eventSourceRef = useRef<EventSource | null>(null);



  useEffect(() => {

    const activeToken =
      token ||
      (typeof window !== "undefined"
        ? localStorage.getItem("smart-site-token")
        : null);



    if (!activeToken || user === undefined) {
      return;
    }



    // -------------------------------------------------
    // Prevent duplicate connections
    // -------------------------------------------------

    if (eventSourceRef.current) {

      console.log(
        "⚠️ SSE already running"
      );

      return;
    }



    // -------------------------------------------------
    // Load initial HA states
    // -------------------------------------------------

    const loadStates = async () => {

      try {

        const data = await apiFetch("/devices/state");


        console.log(
          "📋 Initial device states:",
          data
        );


        setStates(data);


      } catch (err) {

        console.error(
          "❌ Failed loading device states",
          err
        );

      }

    };


    loadStates();




    // -------------------------------------------------
    // Create ONE global SSE connection
    // -------------------------------------------------

    const streamUrl =
      `${API_URL}/devices/stream?token=${encodeURIComponent(activeToken)}`;



    console.log(
      "🔌 Opening global SSE connection"
    );



    const eventSource =
      new EventSource(streamUrl);



    eventSourceRef.current = eventSource;




    eventSource.onopen = () => {

      console.log(
        "🟢 Global SSE connected"
      );

    };




    eventSource.onmessage = (event) => {

      try {

        const update =
          JSON.parse(event.data);



        console.log(
          "📥 Device update:",
          update
        );



        if (
          update.entityId &&
          update.state
        ) {

          setStates(previous => ({
            ...previous,
            [update.entityId]: update.state,
          }));

        }



      } catch(err) {

        console.error(
          "❌ SSE parse error",
          err
        );

      }

    };




    eventSource.onerror = () => {

      console.warn(
        "⚠️ Global SSE error. ReadyState:",
        eventSource.readyState
      );

    };





    return () => {


      console.log(
        "🔌 Closing global SSE"
      );


      eventSource.close();


      eventSourceRef.current = null;


    };



  }, [user, token]);





  return (

    <DeviceContext.Provider
      value={{
        states,
      }}
    >

      {children}

    </DeviceContext.Provider>

  );

}





export function useDevices() {


  const context =
    useContext(DeviceContext);



  if (!context) {

    throw new Error(
      "useDevices must be used inside DeviceProvider"
    );

  }


  return context;

}