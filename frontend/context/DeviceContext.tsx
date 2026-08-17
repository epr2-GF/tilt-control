"use client";

import {
  createContext,
  useContext,
  useEffect,
  useCallback,
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
  refreshStates: () => Promise<void>;
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
  const { token } = useAuth();

  const [states, setStates] =
    useState<DeviceStates>({});

  // Single global SSE connection
  const eventSourceRef =
    useRef<EventSource | null>(null);

  /*
    -------------------------------------------------------------
    REFRESH HOME ASSISTANT STATES
    -------------------------------------------------------------
  */

  const refreshStates = useCallback(async () => {
    try {
      const data = await apiFetch(
        "/devices/state"
      );

      if (!data || typeof data !== "object") {
        console.error(
          "Invalid device state response",
          data
        );

        return;
      }

      setStates(data);

    } catch (error) {
      console.error(
        "Failed refreshing device states",
        error
      );
    }
  }, []);

  /*
    -------------------------------------------------------------
    GLOBAL SSE CONNECTION
    -------------------------------------------------------------
  */

  useEffect(() => {
    const activeToken =
      token ||
      (
        typeof window !== "undefined"
          ? localStorage.getItem(
              "smart-site-token"
            )
          : null
      );

    // Wait until AuthContext has restored the session
    if (!activeToken) {
      return;
    }

    // Prevent duplicate SSE connections
    if (eventSourceRef.current) {
      return;
    }

    /*
      INITIAL STATE LOAD
    */

    refreshStates();

    /*
      CREATE GLOBAL SSE CONNECTION
    */

    const streamUrl =
      `${API_URL}/devices/stream?token=${encodeURIComponent(
        activeToken
      )}`;

    const eventSource =
      new EventSource(streamUrl);

    eventSourceRef.current =
      eventSource;

    /*
      RECEIVE LIVE STATE UPDATES
    */

    eventSource.onmessage =
      (event) => {
        try {
          const update =
            JSON.parse(event.data);

          const entityId =
            update.entityId ||
            update.entity_id;

          if (!entityId) {
            return;
          }

          setStates(previous => ({
            ...previous,

            [entityId]: {
              ...previous[entityId],

              state:
                update.state,

              attributes:
                update.attributes ??
                previous[entityId]?.attributes,
            },
          }));

        } catch (error) {
          console.error(
            "SSE parse error",
            error
          );
        }
      };

    /*
      SSE ERROR

      Do not log normal browser SSE reconnect
      warnings here. EventSource will automatically
      attempt to reconnect.
    */

    eventSource.onerror = () => {
      // EventSource automatically handles reconnection.
    };

    /*
      CLEANUP
    */

    return () => {
      eventSource.close();

      eventSourceRef.current =
        null;
    };

  }, [token, refreshStates]);

  /*
    -------------------------------------------------------------
    PROVIDER
    -------------------------------------------------------------
  */

  return (
    <DeviceContext.Provider
      value={{
        states,
        refreshStates,
      }}
    >
      {children}
    </DeviceContext.Provider>
  );
}

/*
  ---------------------------------------------------------------
  USE DEVICES HOOK
  ---------------------------------------------------------------
*/

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