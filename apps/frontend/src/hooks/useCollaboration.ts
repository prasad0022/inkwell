import { useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { connectSocket } from "@/lib/socket";

interface CollaborationUser {
  socketId: string;
  userId: string;
  name: string;
  color: string;
  cursor: unknown;
}

interface UseCollaborationProps {
  documentId: string;
  userId: string;
  userName: string;
  enabled: boolean;
}

export const useCollaboration = ({
  documentId,
  userId,
  userName,
  enabled,
}: UseCollaborationProps) => {
  const ydocRef = useRef<Y.Doc | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<CollaborationUser[]>([]);
  const [isSynced, setIsSynced] = useState(false);

  useEffect(() => {
    if (!enabled || !documentId || !userId) return;

    // Create Y.js document
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    // Connect socket
    const socket = connectSocket();

    // ── Socket event handlers ──────────────────────────────────────

    socket.on("connect", () => {
      setIsConnected(true);
      console.log("⚡ Socket connected");

      // Join document room
      socket.emit("doc:join", {
        documentId,
        userId,
        userName,
      });
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
      setIsSynced(false);
      console.log("⚡ Socket disconnected");
    });

    // Receive initial Y.js state sync
    socket.on(
      "doc:sync",
      ({ update, users }: { update: string; users: CollaborationUser[] }) => {
        const uint8Array = new Uint8Array(Buffer.from(update, "base64"));
        Y.applyUpdate(ydoc, uint8Array);
        setConnectedUsers(users);
        setIsSynced(true);
        console.log("📄 Document synced");
      },
    );

    // Receive Y.js updates from other users
    socket.on("doc:update", ({ update }: { update: string }) => {
      const uint8Array = new Uint8Array(Buffer.from(update, "base64"));
      Y.applyUpdate(ydoc, uint8Array);
    });

    // Send local Y.js updates to server
    const handleYjsUpdate = (update: Uint8Array, origin: string) => {
      // Don't send updates that came from the server
      if (origin === "remote") return;

      socket.emit("doc:update", {
        documentId,
        update: Buffer.from(update).toString("base64"),
      });
    };

    ydoc.on("update", handleYjsUpdate);

    // User joined/left events
    socket.on("user:joined", (user: CollaborationUser) => {
      setConnectedUsers((prev) => [...prev, user]);
    });

    socket.on("user:left", ({ socketId }: { socketId: string }) => {
      setConnectedUsers((prev) => prev.filter((u) => u.socketId !== socketId));
    });

    // Handle errors
    socket.on("error", ({ message }: { message: string }) => {
      console.error("Socket error:", message);
    });

    // If socket already connected, join room immediately
    if (socket.connected) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsConnected(true);
      socket.emit("doc:join", {
        documentId,
        userId,
        userName,
      });
    }

    // ── Cleanup ────────────────────────────────────────────────────
    return () => {
      ydoc.off("update", handleYjsUpdate);
      socket.off("connect");
      socket.off("disconnect");
      socket.off("doc:sync");
      socket.off("doc:update");
      socket.off("user:joined");
      socket.off("user:left");
      socket.off("error");

      // Leave document room
      socket.emit("doc:leave", { documentId });

      ydoc.destroy();
      ydocRef.current = null;
      setIsSynced(false);
      setIsConnected(false);
    };
  }, [documentId, userId, userName, enabled]);

  return {
    // eslint-disable-next-line react-hooks/refs
    ydoc: ydocRef.current,
    isConnected,
    isSynced,
    connectedUsers,
  };
};
