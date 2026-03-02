"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export type EventStreamMessage = {
  type: "connected" | "heartbeat" | "check-in" | "registration" | "baptism" | "update";
  data?: {
    guestName?: string;
    ticketCode?: string;
    action?: string;
    stats?: {
      totalRegistrations?: number;
      attended?: number;
      baptized?: number;
    };
  };
  timestamp: string;
};

export type UseEventStreamOptions = {
  onMessage?: (message: EventStreamMessage) => void;
  onCheckIn?: (data: { guestName: string; ticketCode: string }) => void;
  onBaptism?: (data: { guestName: string; ticketCode: string }) => void;
  onRegistration?: (data: { guestName: string; ticketCode: string }) => void;
  onError?: (error: Error) => void;
  autoReconnect?: boolean;
  reconnectDelay?: number;
};

export function useEventStream(eventSlug: string, options: UseEventStreamOptions = {}) {
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<EventStreamMessage | null>(null);
  const [connectionCount, setConnectionCount] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const {
    onMessage,
    onCheckIn,
    onBaptism,
    onRegistration,
    onError,
    autoReconnect = true,
    reconnectDelay = 5000,
  } = options;

  const connect = useCallback(() => {
    if (!eventSlug || eventSourceRef.current) return;

    try {
      const eventSource = new EventSource(`/api/events/${eventSlug}/stream`);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        if (mountedRef.current) {
          setConnected(true);
          setError(null);
          setConnectionCount((prev) => prev + 1);
        }
      };

      eventSource.onmessage = (event) => {
        if (!mountedRef.current) return;

        try {
          const message: EventStreamMessage = JSON.parse(event.data);
          setLastMessage(message);
          onMessage?.(message);

          // Handle specific message types
          switch (message.type) {
            case "check-in":
              if (message.data?.guestName) {
                onCheckIn?.({
                  guestName: message.data.guestName,
                  ticketCode: message.data.ticketCode || "",
                });
              }
              break;
            case "baptism":
              if (message.data?.guestName) {
                onBaptism?.({
                  guestName: message.data.guestName,
                  ticketCode: message.data.ticketCode || "",
                });
              }
              break;
            case "registration":
              if (message.data?.guestName) {
                onRegistration?.({
                  guestName: message.data.guestName,
                  ticketCode: message.data.ticketCode || "",
                });
              }
              break;
          }
        } catch (e) {
          console.error("Failed to parse SSE message:", e);
        }
      };

      eventSource.onerror = () => {
        if (!mountedRef.current) return;

        setConnected(false);
        eventSourceRef.current?.close();
        eventSourceRef.current = null;

        const err = new Error("EventSource connection failed");
        setError(err);
        onError?.(err);

        // Auto-reconnect
        if (autoReconnect && mountedRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              connect();
            }
          }, reconnectDelay);
        }
      };
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Failed to create EventSource");
      setError(err);
      onError?.(err);
    }
  }, [eventSlug, onMessage, onCheckIn, onBaptism, onRegistration, onError, autoReconnect, reconnectDelay]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setConnected(false);
  }, []);

  // Connect on mount
  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, [connect, disconnect]);

  // Broadcast a message to all connected clients
  const broadcast = useCallback(async (type: string, data: Record<string, unknown>) => {
    try {
      const response = await fetch(`/api/events/${eventSlug}/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, data }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }, [eventSlug]);

  return {
    connected,
    lastMessage,
    connectionCount,
    error,
    connect,
    disconnect,
    broadcast,
  };
}

export default useEventStream;
