import { Server as HttpServer } from "http";
import { Server as SocketServer, Socket } from "socket.io";
import * as Y from "yjs";
import { applyUpdate, encodeStateAsUpdate } from "yjs";
import { prisma } from "./prisma";

// Store Y.js documents in memory — one per document ID
const ydocs = new Map<string, Y.Doc>();

// Store connected users per document room
const roomUsers = new Map<
  string,
  Map<
    string,
    {
      userId: string;
      name: string;
      color: string;
      cursor: any;
    }
  >
>();

// Generate a random color for each user's cursor
const generateUserColor = (): string => {
  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E9",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Get or create a Y.js document for a given document ID
const getYDoc = (documentId: string): Y.Doc => {
  if (!ydocs.has(documentId)) {
    ydocs.set(documentId, new Y.Doc());
  }
  return ydocs.get(documentId)!;
};

export const initializeSocket = (httpServer: HttpServer) => {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: ["http://localhost:3000", "https://inkwell-collab.vercel.app"],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket: Socket) => {
    console.log(`⚡ Socket connected: ${socket.id}`);

    let currentDocumentId: string | null = null;
    let currentUserId: string | null = null;

    // ── Join document room ──────────────────────────────────────────
    socket.on("doc:join", async ({ documentId, userId, userName }) => {
      try {
        // Verify user has access to this document
        const document = await prisma.document.findUnique({
          where: { id: documentId },
          include: {
            workspace: {
              include: { members: true },
            },
          },
        });

        if (!document) {
          socket.emit("error", { message: "Document not found" });
          return;
        }

        const isMember = document.workspace.members.some(
          (m: any) => m.userId === userId,
        );

        if (!isMember && !document.isPublic) {
          socket.emit("error", { message: "Access denied" });
          return;
        }

        // Leave previous room if any
        if (currentDocumentId) {
          socket.leave(`doc:${currentDocumentId}`);
          removeUserFromRoom(currentDocumentId, socket.id, io);
        }

        currentDocumentId = documentId;
        currentUserId = userId;

        // Join the room
        socket.join(`doc:${documentId}`);

        // Add user to room tracking
        if (!roomUsers.has(documentId)) {
          roomUsers.set(documentId, new Map());
        }

        const userColor = generateUserColor();
        roomUsers.get(documentId)!.set(socket.id, {
          userId,
          name: userName,
          color: userColor,
          cursor: null,
        });

        // Get or create Y.js document
        const ydoc = getYDoc(documentId);

        // Load existing content from database into Y.js if first user
        const roomSize = roomUsers.get(documentId)!.size;
        if (roomSize === 1) {
          try {
            const dbDoc = await prisma.document.findUnique({
              where: { id: documentId },
              select: { content: true },
            });

            if (dbDoc?.content) {
              // Content exists in DB — initialize Y.js with it
              // We store the Y.js state in the content field
              const contentJson = dbDoc.content as any;
              if (contentJson._yjs_state) {
                const uint8Array = new Uint8Array(
                  Buffer.from(contentJson._yjs_state, "base64"),
                );
                applyUpdate(ydoc, uint8Array);
              }
            }
          } catch (err) {
            console.error("Error loading document state:", err);
          }
        }

        // Send current Y.js state to the joining user
        const stateVector = encodeStateAsUpdate(ydoc);
        socket.emit("doc:sync", {
          update: Buffer.from(stateVector).toString("base64"),
          users: Array.from(roomUsers.get(documentId)!.entries()).map(
            ([sid, user]) => ({ socketId: sid, ...user }),
          ),
        });

        // Notify others that a new user joined
        socket.to(`doc:${documentId}`).emit("user:joined", {
          socketId: socket.id,
          userId,
          name: userName,
          color: userColor,
        });

        console.log(`👤 User ${userName} joined doc:${documentId}`);
      } catch (error) {
        console.error("Error joining document:", error);
        socket.emit("error", { message: "Failed to join document" });
      }
    });

    // ── Y.js document update ────────────────────────────────────────
    socket.on("doc:update", async ({ documentId, update }) => {
      try {
        const ydoc = getYDoc(documentId);

        // Apply the update to server Y.js document
        const uint8Array = new Uint8Array(Buffer.from(update, "base64"));
        applyUpdate(ydoc, uint8Array);

        // Broadcast to all OTHER users in the room
        socket.to(`doc:${documentId}`).emit("doc:update", { update });

        // Persist to database every update
        // In production you'd debounce this
        const currentState = encodeStateAsUpdate(ydoc);
        await prisma.document.update({
          where: { id: documentId },
          data: {
            content: {
              _yjs_state: Buffer.from(currentState).toString("base64"),
            },
          },
        });
      } catch (error) {
        console.error("Error handling doc update:", error);
      }
    });

    // ── Cursor/awareness update ─────────────────────────────────────
    socket.on("cursor:update", ({ documentId, cursor }) => {
      if (!currentDocumentId || !roomUsers.has(documentId)) return;

      const userInfo = roomUsers.get(documentId)?.get(socket.id);
      if (userInfo) {
        userInfo.cursor = cursor;
      }

      // Broadcast cursor position to others in room
      socket.to(`doc:${documentId}`).emit("cursor:update", {
        socketId: socket.id,
        userId: currentUserId,
        cursor,
      });
    });

    // ── Disconnect ──────────────────────────────────────────────────
    socket.on("disconnect", () => {
      console.log(`⚡ Socket disconnected: ${socket.id}`);

      if (currentDocumentId) {
        removeUserFromRoom(currentDocumentId, socket.id, io);
      }
    });
  });

  return io;
};

// Helper — remove user from room and notify others
const removeUserFromRoom = (
  documentId: string,
  socketId: string,
  io: SocketServer,
) => {
  if (!roomUsers.has(documentId)) return;

  roomUsers.get(documentId)!.delete(socketId);

  // Notify remaining users
  io.to(`doc:${documentId}`).emit("user:left", { socketId });

  // Clean up empty rooms
  if (roomUsers.get(documentId)!.size === 0) {
    roomUsers.delete(documentId);
    // Keep Y.js doc in memory for a while in case users come back
    // In production you'd have a cleanup job
  }
};
