
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

  const tokenRef = useRef<string | null>(token);
  tokenRef.current = token;

  const [states, setStates] =
    useState<DeviceStates>({});

  const eventSourceRef =
    useRef<EventSource | null>(null);

  /*
    REFRESH HOME ASSISTANT STATES
  */

  const refreshStates = useCallback(async () => {
    if (!token) return;

    const requestToken = token;

    try {
      const data = await apiFetch(
        "/devices/state",
        {},
        requestToken
      );

      if (tokenRef.current !== requestToken) return;

      if (!data || typeof data !== "object") {
        console.error(
          "Invalid device state response",
          data
        );
        return;
      }

      setStates(data);

    } catch (error) {
      if (tokenRef.current === requestToken) {
        console.error(
          "Failed refreshing device states",
          error
        );
      }
    }
  }, [token]);

  /*
    GLOBAL SSE CONNECTION
  */

  useEffect(() => {
    setStates({});

    if (!token) return;

    let cancelled = false;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    /*
      INITIAL STATE LOAD
    */

    const loadStates = async () => {
      try {
        const data = await apiFetch(
          "/devices/state",
          {},
          token
        );

        if (cancelled) return;

        if (!data || typeof data !== "object") {
          console.error(
            "Invalid device state response",
            data
          );
          return;
        }

        setStates(data);

      } catch (error) {
        if (!cancelled) {
          console.error(
            "Failed refreshing device states",
            error
          );
        }
      }
    };

    loadStates();

    /*
      CREATE GLOBAL SSE CONNECTION
    */

    const streamUrl =
      `${API_URL}/devices/stream?token=${encodeURIComponent(token)}`;

    const eventSource = new EventSource(streamUrl);

    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      if (cancelled) return;

      try {
        const update = JSON.parse(event.data);

        const entityId =
          update.entityId || update.entity_id;

        if (!entityId) return;

        setStates(previous => ({
          ...previous,
          [entityId]: {
            ...previous[entityId],
            state: update.state,
            attributes:
              update.attributes ??
              previous[entityId]?.attributes,
          },
        }));

      } catch (error) {
        console.error("SSE parse error", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE connection error", error);
    };

    /*
      CLEANUP
    */

    return () => {
      cancelled = true;

      eventSource.close();

      if (eventSourceRef.current === eventSource) {
        eventSourceRef.current = null;
      }
    };

  }, [token]);

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

export function useDevices() {
  const context = useContext(DeviceContext);

  if (!context) {
    throw new Error(
      "useDevices must be used inside DeviceProvider"
    );
  }

  return context;
}
