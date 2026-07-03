"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useWorkspaces, useCreateWorkspace } from "@/hooks/useWorkspace";
import { useLogout } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, LogOut, ChevronRight } from "lucide-react";
import type { User, Workspace } from "@/types/api";
import { AxiosError } from "axios";

interface SidebarProps {
  user: User;
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useLogout();
  const { data: workspaces, isLoading } = useWorkspaces();
  const { mutate: createWorkspace, isPending } = useCreateWorkspace();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceDescription, setWorkspaceDescription] = useState("");

  const handleCreateWorkspace = () => {
    if (!workspaceName.trim()) {
      toast.error("Workspace name is required");
      return;
    }

    createWorkspace(
      {
        name: workspaceName.trim(),
        description: workspaceDescription.trim() || undefined,
      },
      {
        onSuccess: (data) => {
          toast.success("Workspace created!");
          setShowCreateModal(false);
          setWorkspaceName("");
          setWorkspaceDescription("");
          router.push(`/dashboard/${data.slug}`);
        },
        onError: (err: Error) => {
          if (err instanceof AxiosError) {
            toast.error(
              err.response?.data?.message || "Failed to create workspace",
            );
          } else {
            toast.error("Failed to create workspace");
          }
        },
      },
    );
  };

  return (
    <>
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
        {/* Logo */}
        <div className="p-4 border-b border-gray-100">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-xl">🖊️</span>
            <span className="font-semibold text-gray-900">Inkwell</span>
          </Link>
        </div>

        {/* Workspaces */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Workspaces
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setShowCreateModal(true)}
              title="New workspace"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-1">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-8 bg-gray-100 rounded animate-pulse"
                />
              ))}
            </div>
          ) : workspaces?.length === 0 ? (
            <div className="px-2 py-4 text-center">
              <p className="text-xs text-gray-400 mb-2">No workspaces yet</p>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => setShowCreateModal(true)}
              >
                Create your first workspace
              </Button>
            </div>
          ) : (
            <div className="space-y-0.5">
              {workspaces?.map((workspace: Workspace) => {
                const isActive = pathname.startsWith(
                  `/dashboard/${workspace.slug}`,
                );
                return (
                  <Link
                    key={workspace.id}
                    href={`/dashboard/${workspace.slug}`}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                      isActive
                        ? "bg-gray-100 text-gray-900 font-medium"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <ChevronRight
                      className={`h-3.5 w-3.5 text-gray-400 transition-transform ${
                        isActive ? "rotate-90" : ""
                      }`}
                    />
                    <span className="truncate">{workspace.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* User section */}
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md">
            <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
              <span className="text-xs font-medium text-gray-600">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 mt-1 text-gray-500 hover:text-gray-900"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Create workspace modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a workspace</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                Workspace name
              </label>
              <Input
                placeholder="My Team Workspace"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateWorkspace()}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                Description{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <Input
                placeholder="What is this workspace for?"
                value={workspaceDescription}
                onChange={(e) => setWorkspaceDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateWorkspace} disabled={isPending}>
              {isPending ? "Creating..." : "Create workspace"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
