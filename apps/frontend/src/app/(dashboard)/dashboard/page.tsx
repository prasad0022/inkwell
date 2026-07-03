"use client";

import Link from "next/link";
import { useWorkspaces } from "@/hooks/useWorkspace";
import type { Workspace } from "@/types/api";
import { FileText, Users } from "lucide-react";

export default function DashboardHomePage() {
  const { data: workspaces } = useWorkspaces();

  return (
    <div className="p-8">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Good to see you 👋
        </h1>
        <p className="text-gray-500 mb-8">
          Select a workspace from the sidebar or create a new one to get
          started.
        </p>

        {workspaces && workspaces.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
              Your workspaces
            </h2>
            <div className="grid gap-3">
              {workspaces.map((workspace: Workspace) => (
                <Link
                  key={workspace.id}
                  href={`/dashboard/${workspace.slug}`}
                  className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all"
                >
                  <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    <span className="text-lg">
                      {workspace.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {workspace.name}
                    </p>
                    {workspace.description && (
                      <p className="text-sm text-gray-400 truncate">
                        {workspace.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" />
                      {workspace._count?.documents || 0} docs
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {workspace._count?.members || 0} members
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
