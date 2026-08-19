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

interface EditorProps {
  content?: Record<string, unknown> | null;
  onChange?: (content: Record<string, unknown>) => void;
  editable?: boolean;
  placeholder?: string;
  // Collaboration props
  ydoc?: Y.Doc | null;
}

export default function Editor({
  content,
  onChange,
  editable = true,
  placeholder = "Start writing...",
  ydoc,
}: EditorProps) {
  const isCollaborative = !!ydoc;

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      // When collaborative, StarterKit must disable history
      // because Y.js handles undo/redo
      StarterKit.configure({
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
      {editable && <EditorToolbar editor={editor} />}
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
