"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSearchDocuments } from "@/hooks/useDocument";
import { Input } from "@/components/ui/input";
import { Search, FileText, Loader2, X } from "lucide-react";
import type { SearchResult } from "@/lib/api/document.api";

interface SearchBarProps {
  workspaceId: string;
  slug: string;
}

export default function SearchBar({ workspaceId, slug }: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: results, isLoading } = useSearchDocuments(workspaceId, query);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (result: SearchResult) => {
    router.push(`/dashboard/${slug}/doc/${result.id}`);
    setQuery("");
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setQuery("");
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search documents..."
          className="pl-8 pr-8 h-8 text-xs bg-gray-50 border-gray-200 focus:bg-white"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setIsOpen(false);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2"
          >
            <X className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {isOpen && query.trim().length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center gap-2 px-3 py-3 text-xs text-gray-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Searching...
            </div>
          ) : results?.length === 0 ? (
            <div className="px-3 py-3 text-xs text-gray-400 text-center">
              No documents found for "{query}"
            </div>
          ) : (
            <div>
              <div className="px-3 py-1.5 text-xs text-gray-400 border-b border-gray-100">
                {results?.length} result{results?.length !== 1 ? "s" : ""}
              </div>
              {results?.map((result: SearchResult) => (
                <button
                  key={result.id}
                  onClick={() => handleSelect(result)}
                  className="w-full flex items-start gap-2.5 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
                >
                  <span className="text-base shrink-0 mt-0.5">
                    {result.emoji || "📝"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {result.title || "Untitled"}
                    </p>
                    {result.excerpt && (
                      <p
                        className="text-xs text-gray-400 mt-0.5 line-clamp-2 search-excerpt"
                        dangerouslySetInnerHTML={{ __html: result.excerpt }}
                      />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
