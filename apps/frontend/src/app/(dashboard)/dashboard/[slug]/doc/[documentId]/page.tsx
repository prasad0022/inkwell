/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/refs */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useDocument,
  useUpdateDocument,
  useDeleteDocument,
} from "@/hooks/useDocument";
import { useWorkspace, useWorkspaceMembers } from "@/hooks/useWorkspace";
import { useMe } from "@/hooks/useAuth";
import { useCollaboration } from "@/hooks/useCollaboration";
import Editor from "@/components/editor/Editor";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";
import {
  ChevronRight,
  Loader2,
  Check,
  AlertCircle,
  Wifi,
  WifiOff,
  Eye,
  Trash2,
  Settings,
} from "lucide-react";
import Link from "next/link";
import EmojiPicker from "emoji-picker-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function DocumentPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const documentId = params.documentId as string;

  const { data: doc, isLoading } = useDocument(documentId);
  const { data: workspace } = useWorkspace(slug);
  const { data: user } = useMe();
  const { mutate: updateDocument } = useUpdateDocument();
  const { data: members } = useWorkspaceMembers(slug);
  const { mutate: deleteDocument, isPending: deleting } = useDeleteDocument();

  // Derive current user's role
  const currentUserRole = members?.find(
    (m: any) => m.user.id === user?.id,
  )?.role;

  const canEdit = currentUserRole === "OWNER" || currentUserRole === "EDITOR";
  const roleResolved = !!currentUserRole;

  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [isMounted, setIsMounted] = useState(false);

  const isInitialLoad = useRef(true);
  const [debouncedTitle] = useDebounce(title, 1000);

  // Generate consistent color for this user
  const userColor = useRef(
    // eslint-disable-next-line react-hooks/purity
    `#${Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, "0")}`,
  );

  // Initialize collaboration
  const { ydoc, isConnected, isSynced, connectedUsers } = useCollaboration({
    documentId,
    userId: user?.id || "",
    userName: user?.name || "Anonymous",
    enabled: isMounted && !!user && !!documentId,
  });

  const save = useCallback(
    (data: { title?: string; emoji?: string; isPublic?: boolean }) => {
      return new Promise<void>((resolve, reject) => {
        updateDocument(
          { documentId, input: data },
          {
            onSuccess: () => resolve(),
            onError: () => reject(),
          },
        );
      });
    },
    [documentId, updateDocument],
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!doc) return;

    isInitialLoad.current = true;
    setTitle(doc.title || "Untitled");
    setEmoji(doc.emoji || "");

    const timer = setTimeout(() => {
      isInitialLoad.current = false;
    }, 100);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc?.id]);

  // Auto-save title
  useEffect(() => {
    if (!isMounted) return;
    if (isInitialLoad.current) return;
    if (!debouncedTitle) return;
    if (!roleResolved) return;
    if (!canEdit) return;

    let cancelled = false;

    setSaveStatus("saving");
    save({ title: debouncedTitle })
      .then(() => {
        if (!cancelled) {
          setSaveStatus("saved");
          setTimeout(() => {
            if (!cancelled) setSaveStatus("idle");
          }, 2000);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSaveStatus("error");
          toast.error("Failed to save");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedTitle, isMounted, save, canEdit, roleResolved]);

  const handleEmojiSelect = (emojiData: { emoji: string }) => {
    const newEmoji = emojiData.emoji;
    setEmoji(newEmoji);
    setSaveStatus("saving");
    save({ emoji: newEmoji })
      .then(() => {
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      })
      .catch(() => {
        setSaveStatus("error");
        toast.error("Failed to save emoji");
      });
  };

  const handleDelete = () => {
    if (!confirm(`Delete "${title || "Untitled"}"? This cannot be undone.`))
      return;

    deleteDocument(documentId, {
      onSuccess: () => {
        toast.success("Document deleted");
        router.push(`/dashboard/${slug}`);
      },
      onError: (err: Error) => {
        toast.error(err.message || "Failed to delete document");
      },
    });
  };

  const handleTogglePublic = () => {
    save({ isPublic: !doc?.isPublic })
      .then(() =>
        toast.success(
          doc?.isPublic ? "Document is now private" : "Document is now public",
        ),
      )
      .catch(() => toast.error("Failed to update document"));
  };

  if (!isMounted || isLoading) {
    return (
      <div className="flex-1 p-8">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="h-10 w-64 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="flex-1 p-8 text-center">
        <p className="text-gray-500">Document not found.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push(`/dashboard/${slug}`)}
        >
          Back to workspace
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-3 border-b border-gray-100 bg-white">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm text-gray-400">
          <Link
            href="/dashboard"
            className="hover:text-gray-600 transition-colors"
          >
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link
            href={`/dashboard/${slug}`}
            className="hover:text-gray-600 transition-colors"
          >
            {workspace?.name}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-gray-600 font-medium truncate max-w-32">
            {title || "Untitled"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Connected users avatars */}
          {connectedUsers.length > 0 && (
            <div className="flex items-center gap-1">
              {connectedUsers.slice(0, 4).map((u) => (
                <div
                  key={u.socketId}
                  className="h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-medium ring-2 ring-white"
                  style={{ backgroundColor: u.color }}
                  title={u.name}
                >
                  {u.name.charAt(0).toUpperCase()}
                </div>
              ))}
              {connectedUsers.length > 4 && (
                <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600 ring-2 ring-white">
                  +{connectedUsers.length - 4}
                </div>
              )}
            </div>
          )}

          {/* Connection status */}
          <div className="flex items-center gap-1.5 text-xs">
            {isConnected ? (
              <>
                <Wifi className="h-3.5 w-3.5 text-green-500" />
                <span className="text-green-500">
                  {isSynced ? "Live" : "Syncing..."}
                </span>
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-gray-400">Offline</span>
              </>
            )}
          </div>

          {/* Save status — only for editors */}
          {canEdit && (
            <div className="flex items-center gap-1.5 text-xs">
              {saveStatus === "saving" && (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />
                  <span className="text-gray-400">Saving...</span>
                </>
              )}
              {saveStatus === "saved" && (
                <>
                  <Check className="h-3.5 w-3.5 text-green-500" />
                  <span className="text-green-500">Saved</span>
                </>
              )}
              {saveStatus === "error" && (
                <>
                  <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                  <span className="text-red-500">Save failed</span>
                </>
              )}
            </div>
          )}

          {/* Settings dropdown — only for editors/owners */}
          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Settings className="h-4 w-4 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleTogglePublic}>
                  {doc?.isPublic ? "🔒 Make private" : "🌐 Make public"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-red-600 focus:text-red-600"
                  disabled={deleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete document
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* For viewer */}
          {!canEdit && currentUserRole && (
            <div className="flex items-center gap-1.5 text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">
              <Eye className="h-3 w-3" />
              View only
            </div>
          )}
        </div>
      </div>

      {/* Document content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-10">
          {/* Emoji picker */}
          {canEdit ? (
            <Popover>
              <PopoverTrigger asChild>
                <button className="text-4xl mb-4 hover:opacity-70 transition-opacity">
                  {emoji || "📝"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border-0">
                <EmojiPicker onEmojiClick={handleEmojiSelect} />
              </PopoverContent>
            </Popover>
          ) : (
            <div className="text-4xl mb-4">{emoji || "📝"}</div>
          )}

          {/* Editable title */}
          <input
            type="text"
            value={title}
            onChange={(e) => canEdit && setTitle(e.target.value)}
            placeholder="Untitled"
            readOnly={!canEdit}
            className={`w-full text-4xl font-bold text-gray-900 bg-transparent border-none outline-none placeholder-gray-300 mb-6 ${
              !canEdit ? "cursor-default" : ""
            }`}
          />

          {/* Collaborative Tiptap Editor */}
          {isSynced && ydoc ? (
            <Editor
              ydoc={ydoc}
              editable={canEdit}
              placeholder={
                canEdit
                  ? "Start writing your note..."
                  : "You have view-only access to this document."
              }
            />
          ) : (
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Connecting to live session...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
