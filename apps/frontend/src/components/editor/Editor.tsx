"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import Highlight from "@tiptap/extension-highlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import CharacterCount from "@tiptap/extension-character-count";
import { useEffect, useCallback } from "react";
import EditorToolbar from "./EditorToolbar";

interface EditorProps {
  content?: any;
  onChange?: (content: any) => void;
  editable?: boolean;
  placeholder?: string;
}

export default function Editor({
  content,
  onChange,
  editable = true,
  placeholder = "Start writing...",
}: EditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Typography,
      Highlight.configure({
        multicolor: true,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      CharacterCount,
    ],
    content: content || "",
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON());
    },
  });

  // Update content when prop changes (for loading saved docs)
  useEffect(() => {
    if (
      editor &&
      content &&
      JSON.stringify(editor.getJSON()) !== JSON.stringify(content)
    ) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Update editable state
  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editable, editor]);

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
        <div className="px-16 py-2 border-t border-gray-100 text-xs text-gray-400">
          {editor.storage.characterCount.characters()} characters ·{" "}
          {editor.storage.characterCount.words()} words
        </div>
      )}
    </div>
  );
}
