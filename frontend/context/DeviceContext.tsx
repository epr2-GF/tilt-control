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


const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "/api";


type DeviceValue = {
  state: string;
  attributes?: {
    current_position?: number;
    [key: string]: any;
  };
};


type DeviceStates = {
  [entityId: string]: DeviceValue;
};


type DeviceContextType = {
  states: DeviceStates;
};


const DeviceContext =
  createContext<DeviceContextType | undefined>(
    undefined
  );



export function DeviceProvider({
  children,
}: {
  children: ReactNode;
}) {


  const { user, token } = useAuth();


  const [states, setStates] =
    useState<DeviceStates>({});


  // Single SSE connection holder
  const eventSourceRef =
    useRef<EventSource | null>(null);


  useEffect(() => {


    const activeToken =
      token ||
      (typeof window !== "undefined"
        ? localStorage.getItem(
            "smart-site-token"
          )
        : null);

    // Wait until AuthContext has finished restoring session
    if (!user || !activeToken) {
      return;
    }

    // Prevent duplicate SSE connections
    if (eventSourceRef.current) {

      console.log(
        "⚠️ SSE already running"
      );

      return;
    }

    /*
      LOAD INITIAL DEVICE STATES
    */

    async function loadStates() {

      try {

        const data =
          await apiFetch(
            "/devices/state"
          );


        setStates(data);


      } catch(error) {


        console.error(
          "❌ Failed loading device states",
          error
        );


      }

    }



    loadStates();






    /*
      CREATE SSE CONNECTION
    */


    const streamUrl =
      `${API_URL}/devices/stream?token=${encodeURIComponent(
        activeToken
      )}`;



    console.log(
      "🔌 Opening global SSE connection"
    );



    const eventSource =
      new EventSource(
        streamUrl
      );



    eventSourceRef.current =
      eventSource;





    eventSource.onopen = () => {


      console.log(
        "🟢 Global SSE connected"
      );


    };

    eventSource.onmessage =
      (event) => {


        try {

          const update =
            JSON.parse(
              event.data
            );



          if (
            update.entityId
          ) {


            setStates(
              previous => ({

                ...previous,


                [update.entityId]:
                {

                  state:
                    update.state,


                  attributes:
                    update.attributes,

                }

              })
            );


          }



        }
        catch(error) {


          console.error(
            "❌ SSE parse error",
            error
          );


        }


      };






    eventSource.onerror =
      () => {


        console.warn(
          "⚠️ Global SSE error",
          eventSource.readyState
        );


      };







    return () => {


      console.log(
        "🔌 Closing global SSE"
      );



      eventSource.close();


      eventSourceRef.current =
        null;


    };



  }, [user, token]);







  return (

    <DeviceContext.Provider

      value={{
        states
      }}

    >

      {children}

    </DeviceContext.Provider>


  );

}







export function useDevices() {


  const context =
    useContext(
      DeviceContext
    );



  if (!context) {

    throw new Error(
      "useDevices must be used inside DeviceProvider"
    );

  }



  return context;


}