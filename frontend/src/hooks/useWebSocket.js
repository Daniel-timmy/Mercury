// src/hooks/useWebSocket.js
import { useEffect, useRef, useCallback } from "react";

export const useWebSocket = (
  url, // e.g. `/ws/tracking/${managerId}/`
  onMessage, // (data: any) => void
  onOpen = () => {}, // optional
  onClose = () => {}, // optional
  options = {}
) => {
  const {
    reconnect = true,
    maxRetries = 10, // 0 = infinite
    baseDelay = 1000, // ms
    maxDelay = 30000, // ms
    jitter = 0.2, // ±20% random jitter
  } = options;

  const wsRef = (useRef < WebSocket) | (null > null);
  const retryCountRef = useRef(0);
  const reconnectTimerRef = (useRef < NodeJS.Timeout) | (null > null);
  const managerIdRef = (useRef < string) | (null > null);

  // --- Helper: calculate next delay (exponential back-off) -----------------
  const getDelay = () => {
    if (!reconnect) return 0;

    const attempt = Math.min(retryCountRef.current, 8); // cap exponent
    let delay = baseDelay * 2 ** attempt;
    delay = Math.min(delay, maxDelay);

    // add jitter
    const jitterMs = delay * jitter;
    delay = delay - jitterMs + Math.random() * 2 * jitterMs;

    return Math.round(delay);
  };

  // --- Core: create a fresh WS --------------------------------------------
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[WS] Connected →", url);
      retryCountRef.current = 0; // reset back-off
      onOpen();
    };

    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        onMessage(data);
      } catch (e) {
        console.warn("[WS] Invalid JSON", ev.data);
      }
    };

    ws.onerror = (err) => {
      console.error("[WS] error", err);
    };

    ws.onclose = (ev) => {
      console.log("[WS] closed", ev.code, ev.reason);
      wsRef.current = null;
      onClose();

      // ---- AUTO-RECONNECT -------------------------------------------------
      if (
        reconnect &&
        (maxRetries === 0 || retryCountRef.current < maxRetries)
      ) {
        retryCountRef.current += 1;
        const delay = getDelay();
        console.log(`[WS] Reconnect #${retryCountRef.current} in ${delay}ms`);
        reconnectTimerRef.current = setTimeout(connect, delay);
      }
    };
  }, [url, onMessage, onOpen, onClose, reconnect, maxRetries]);

  // --- Public: force reconnect (e.g. after auth change) --------------------
  const reconnectNow = useCallback(() => {
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    if (wsRef.current) wsRef.current.close();
    connect();
  }, [connect]);

  // --- Effect: start on mount / url change ---------------------------------
  useEffect(() => {
    // Extract manager_id from URL for debugging / re-join logic
    const match = url.match(/\/([^/]+)\/$/);
    managerIdRef.current = match ? match[1] : null;

    connect();

    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [url, connect]);

  return { reconnectNow };
};
