"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDocument, useUpdateDocument } from "@/hooks/useDocument";
import { useWorkspace } from "@/hooks/useWorkspace";
import Editor from "@/components/editor/Editor";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";
import { ChevronRight, Loader2, Check, AlertCircle } from "lucide-react";
import Link from "next/link";
import EmojiPicker from "emoji-picker-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
// import type { Document } from "@/types/api";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function DocumentPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const documentId = params.documentId as string;

  // Rename to avoid conflict with browser's built-in `document`
  const { data: doc, isLoading } = useDocument(documentId);
  const { data: workspace } = useWorkspace(slug);
  const { mutate: updateDocument } = useUpdateDocument();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState<Record<string, unknown> | null>(null);
  const [emoji, setEmoji] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [isMounted, setIsMounted] = useState(false);

  // Track initial load to prevent auto-save on first render
  const isInitialLoad = useRef(true);

  const [debouncedContent] = useDebounce(content, 1000);
  const [debouncedTitle] = useDebounce(title, 1000);

  // Declare handleSave BEFORE useEffects that use it
  const handleSave = useCallback(
    (data: {
      title?: string;
      content?: Record<string, unknown>;
      emoji?: string;
    }) => {
      setSaveStatus("saving");

      updateDocument(
        { documentId, input: data },
        {
          onSuccess: () => {
            setSaveStatus("saved");
            setTimeout(() => setSaveStatus("idle"), 2000);
          },
          onError: () => {
            setSaveStatus("error");
            toast.error("Failed to save document");
          },
        },
      );
    },
    [documentId, updateDocument],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsMounted(true);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  // Load document data into state once
  useEffect(() => {
    if (!doc) return;

    isInitialLoad.current = true;

    // Batch state updates to avoid cascading renders
    const timer = setTimeout(() => {
      setTitle(doc.title || "Untitled");
      setContent(doc.content || null);
      setEmoji(doc.emoji || "");
      isInitialLoad.current = false;
    }, 0);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc?.id]); // only re-run when document ID changes, not on every doc update

  // Auto-save content
  useEffect(() => {
    if (!isMounted) return;
    if (isInitialLoad.current) return;
    if (debouncedContent === null) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    handleSave({ content: debouncedContent });
  }, [debouncedContent, isMounted, handleSave]);

  // Auto-save title
  useEffect(() => {
    if (!isMounted) return;
    if (isInitialLoad.current) return;
    if (!debouncedTitle) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    handleSave({ title: debouncedTitle });
  }, [debouncedTitle, isMounted, handleSave]);

  const handleEmojiSelect = (emojiData: { emoji: string }) => {
    const newEmoji = emojiData.emoji;
    setEmoji(newEmoji);
    handleSave({ emoji: newEmoji });
  };

  if (!isMounted || isLoading) {
    return (
      <div className="flex-1 p-8">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="h-10 w-64 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
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

        {/* Save status */}
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
      </div>

      {/* Document content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-10">
          {/* Emoji picker */}
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

          {/* Editable title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled"
            className="w-full text-4xl font-bold text-gray-900 bg-transparent border-none outline-none placeholder-gray-300 mb-6"
          />

          {/* Tiptap Editor */}
          <Editor
            content={content}
            onChange={setContent}
            editable={true}
            placeholder="Start writing your note..."
          />
        </div>
      </div>
    </div>
  );
}
