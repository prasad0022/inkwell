"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import Highlight from "@tiptap/extension-highlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import CharacterCount from "@tiptap/extension-character-count";
import Collaboration from "@tiptap/extension-collaboration";
import { useEffect } from "react";
import EditorToolbar from "./EditorToolbar";
import * as Y from "yjs";
import Image from "@tiptap/extension-image";
import { uploadImageToS3 } from "@/lib/upload-image";

interface EditorProps {
  content?: Record<string, unknown> | null;
  onChange?: (content: Record<string, unknown>) => void;
  editable?: boolean;
  placeholder?: string;
  ydoc?: Y.Doc | null;
  onUploadImage?: (file: File) => Promise<string>;
}

export default function Editor({
  content,
  onChange,
  editable = true,
  placeholder = "Start writing...",
  ydoc,
  onUploadImage,
}: EditorProps) {
  const isCollaborative = !!ydoc;

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      // When collaborative, StarterKit must disable history
      // because Y.js handles undo/redo
      StarterKit.configure({
        undoRedo: isCollaborative ? false : undefined,
        heading: { levels: [1, 2, 3] },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Placeholder.configure({ placeholder }),
      Typography,
      Highlight.configure({ multicolor: true }),
      TaskList,
      TaskItem.configure({ nested: true }),
      CharacterCount,

      // Image extension with custom upload
      Image.configure({
        allowBase64: false,
        HTMLAttributes: {
          class: "max-w-full rounded-lg my-4",
        },
      }),

      // Collaboration extensions — only add when Y.js doc is available
      ...(isCollaborative && ydoc
        ? [
            Collaboration.configure({
              document: ydoc,
            }),
          ]
        : []),
    ],
    content: isCollaborative ? undefined : content || "",
    editable,
    onUpdate: ({ editor }) => {
      if (!isCollaborative) {
        onChange?.(editor.getJSON() as Record<string, unknown>);
      }
    },
    editorProps: {
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;

        for (const item of Array.from(items)) {
          if (item.type.startsWith("image/")) {
            event.preventDefault();
            const file = item.getAsFile();
            if (!file || !onUploadImage) return false;

            onUploadImage(file)
              .then((url) => {
                editor?.chain().focus().setImage({ src: url }).run();
              })
              .catch((err) => {
                console.error("Image upload failed:", err);
              });
            return true;
          }
        }
        return false;
      },
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files;
        if (!files?.length) return false;

        const imageFiles = Array.from(files).filter((f) =>
          f.type.startsWith("image/"),
        );
        if (!imageFiles.length) return false;

        event.preventDefault();
        imageFiles.forEach((file) => {
          if (!onUploadImage) return;
          onUploadImage(file)
            .then((url) => {
              editor?.chain().focus().setImage({ src: url }).run();
            })
            .catch((err) => {
              console.error("Image upload failed:", err);
            });
        });
        return true;
      },
    },
  });

  // Update editable state
  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editable, editor]);

  // Update content when prop changes (non-collaborative mode)
  useEffect(() => {
    if (editor && !isCollaborative && content) {
      if (JSON.stringify(editor.getJSON()) !== JSON.stringify(content)) {
        editor.commands.setContent(content);
      }
    }
  }, [content, editor, isCollaborative]);

  if (!editor) return null;

  return (
    <div className="flex flex-col h-full">
      {editable && (
        <EditorToolbar editor={editor} onUploadImage={onUploadImage} />
      )}
      <div className="flex-1 overflow-y-auto">
        <EditorContent
          editor={editor}
          className="prose prose-slate max-w-none h-full px-16 py-8 focus:outline-none"
        />
      </div>
      {editable && (
        <div className="px-16 py-2 border-t border-gray-100 text-xs text-gray-400 flex items-center justify-between">
          <span>
            {editor.storage.characterCount.characters()} characters ·{" "}
            {editor.storage.characterCount.words()} words
          </span>
        </div>
      )}
    </div>
  );
}
