import { useEffect } from "react";
import { useInvalidateMemories } from "@/lib/queries";
import { SENTINEL_API_BASE } from "@/lib/sentinelBackend";
import { toast } from "sonner";

export function useSentinelWebsocket() {
  const invalidateMemories = useInvalidateMemories();

  useEffect(() => {
    // Derive ws:// or wss:// from the HTTP base URL
    const wsBase = SENTINEL_API_BASE.replace(/^https/, "wss").replace(/^http/, "ws");
    const wsUrl = `${wsBase}/api/v1/ws/events`;
    let ws: WebSocket;

    const connect = () => {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("Connected to Sentinel WebSocket");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "refresh_memories") {
            invalidateMemories(data.service);
            toast("New activity detected", {
              description: `Sentinel AI analyzed a deployment or incident for ${data.service}.`,
            });
          }
        } catch (e) {
          console.error("Failed to parse websocket message", e);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected. Reconnecting in 3s...");
        setTimeout(connect, 3000);
      };
      
      ws.onerror = (err) => {
        console.error("WebSocket error", err);
        ws.close();
      }
    };

    connect();

    return () => {
      if (ws) {
        ws.onclose = null; // Prevent reconnect loop on unmount
        ws.close();
      }
    };
  }, [invalidateMemories]);
}
