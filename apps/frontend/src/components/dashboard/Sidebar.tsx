"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useWorkspaces, useCreateWorkspace } from "@/hooks/useWorkspace";
import { useDocuments, useCreateDocument } from "@/hooks/useDocument";
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
import {
  Plus,
  LogOut,
  ChevronRight,
  Loader2,
  Users,
  Settings,
} from "lucide-react";
import { AxiosError } from "axios";
import type { User, Workspace, Document } from "@/types/api";
import type { ApiError } from "@/types/api";

interface SidebarProps {
  user: User;
}

// Sub-component for document list under active workspace
function WorkspaceDocuments({
  workspaceId,
  slug,
  onCreateDocument,
  canEdit,
}: {
  workspaceId: string;
  slug: string;
  onCreateDocument: () => void;
  canEdit: boolean;
}) {
  const { data: documents, isLoading } = useDocuments(workspaceId);
  const pathname = usePathname();

  if (isLoading) {
    return (
      <div className="ml-4 space-y-1 mt-1">
        {[1, 2].map((i) => (
          <div key={i} className="h-6 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="ml-4 mt-1 space-y-0.5">
      {documents?.map((doc: Document) => {
        const isActive = pathname.includes(`/doc/${doc.id}`);
        return (
          <Link
            key={doc.id}
            href={`/dashboard/${slug}/doc/${doc.id}`}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${
              isActive
                ? "bg-gray-100 text-gray-900 font-medium"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            }`}
          >
            <span>{doc.emoji || "📝"}</span>
            <span className="truncate">{doc.title || "Untitled"}</span>
          </Link>
        );
      })}

      <Link
        href={`/dashboard/${slug}/members`}
        className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${
          pathname.includes("/members")
            ? "bg-gray-100 text-gray-900 font-medium"
            : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
        }`}
      >
        <Users className="h-3 w-3" />
        <span>Members</span>
      </Link>

      {/* Settings — only show for owners/editors */}
      {canEdit && (
        <Link
          href={`/dashboard/${slug}/settings`}
          className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${
            pathname.includes("/settings")
              ? "bg-gray-100 text-gray-900 font-medium"
              : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Settings className="h-3 w-3" />
          <span>Settings</span>
        </Link>
      )}

      {canEdit && (
        <button
          onClick={onCreateDocument}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors w-full"
        >
          <Plus className="h-3 w-3" />
          <span>New document</span>
        </button>
      )}
    </div>
  );
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useLogout();
  const { data: workspaces, isLoading } = useWorkspaces();
  const { mutate: createWorkspace, isPending: creatingWorkspace } =
    useCreateWorkspace();
  const { mutate: createDocument, isPending: creatingDocument } =
    useCreateDocument();

  const [showCreateWorkspaceModal, setShowCreateWorkspaceModal] =
    useState(false);
  const [showCreateDocumentModal, setShowCreateDocumentModal] = useState(false);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(
    null,
  );
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceDescription, setWorkspaceDescription] = useState("");
  const [documentTitle, setDocumentTitle] = useState("");

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
          setShowCreateWorkspaceModal(false);
          setWorkspaceName("");
          setWorkspaceDescription("");
          router.push(`/dashboard/${data.slug}`);
        },
        onError: (error: Error) => {
          const err = error as AxiosError<ApiError>;
          toast.error(
            err.response?.data?.message || "Failed to create workspace",
          );
        },
      },
    );
  };

  const handleCreateDocument = () => {
    if (!activeWorkspaceId) return;

    createDocument(
      {
        title: documentTitle.trim() || "Untitled",
        workspaceId: activeWorkspaceId,
      },
      {
        onSuccess: (data) => {
          toast.success("Document created!");
          setShowCreateDocumentModal(false);
          setDocumentTitle("");
          // Find workspace slug
          const workspace = workspaces?.find(
            (w: Workspace) => w.id === activeWorkspaceId,
          );
          if (workspace) {
            router.push(`/dashboard/${workspace.slug}/doc/${data.id}`);
          }
        },
        onError: (error: Error) => {
          const err = error as AxiosError<ApiError>;
          toast.error(
            err.response?.data?.message || "Failed to create document",
          );
        },
      },
    );
  };

  const openCreateDocument = (workspaceId: string) => {
    setActiveWorkspaceId(workspaceId);
    setShowCreateDocumentModal(true);
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
              onClick={() => setShowCreateWorkspaceModal(true)}
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
                onClick={() => setShowCreateWorkspaceModal(true)}
              >
                Create your first workspace
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              {workspaces?.map((workspace: Workspace) => {
                const isActive = pathname.startsWith(
                  `/dashboard/${workspace.slug}`,
                );
                // Get current user's role in this workspace
                const userRole = workspace.members?.[0]?.role;
                const workspaceCanEdit =
                  userRole === "OWNER" || userRole === "EDITOR";

                return (
                  <div key={workspace.id}>
                    <Link
                      href={`/dashboard/${workspace.slug}`}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                        isActive
                          ? "bg-gray-100 text-gray-900 font-medium"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <ChevronRight
                        className={`h-3.5 w-3.5 text-gray-400 transition-transform shrink-0 ${
                          isActive ? "rotate-90" : ""
                        }`}
                      />
                      <span className="truncate">{workspace.name}</span>
                    </Link>

                    {/* Show documents under active workspace */}
                    {isActive && (
                      <WorkspaceDocuments
                        workspaceId={workspace.id}
                        slug={workspace.slug}
                        onCreateDocument={() =>
                          openCreateDocument(workspace.id)
                        }
                        canEdit={workspaceCanEdit}
                      />
                    )}
                  </div>
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
      <Dialog
        open={showCreateWorkspaceModal}
        onOpenChange={setShowCreateWorkspaceModal}
      >
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
              onClick={() => setShowCreateWorkspaceModal(false)}
              disabled={creatingWorkspace}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateWorkspace}
              disabled={creatingWorkspace}
            >
              {creatingWorkspace ? "Creating..." : "Create workspace"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create document modal */}
      <Dialog
        open={showCreateDocumentModal}
        onOpenChange={setShowCreateDocumentModal}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New document</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Input
              placeholder="Document title (optional)"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateDocument()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDocumentModal(false)}
              disabled={creatingDocument}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateDocument}
              disabled={creatingDocument}
              className="gap-2"
            >
              {creatingDocument && <Loader2 className="h-4 w-4 animate-spin" />}
              {creatingDocument ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
