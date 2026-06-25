"use client";

import { useState } from "react";
import Editor from "@/components/editor/Editor";

export default function EditorTestPage() {
  const [content, setContent] = useState<any>(null);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto py-8">
        <h1 className="text-2xl font-bold text-gray-900 px-16 mb-4">
          🖊️ Inkwell Editor Test
        </h1>
        <div className="border border-gray-200 rounded-lg overflow-hidden min-h-screen">
          <Editor
            content={content}
            onChange={setContent}
            placeholder="Start writing your note..."
          />
        </div>
        {content && (
          <div className="mt-4 px-16">
            <p className="text-xs text-gray-400 mb-2">
              JSON output (what gets saved to DB):
            </p>
            <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-auto max-h-48 border">
              {JSON.stringify(content, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
