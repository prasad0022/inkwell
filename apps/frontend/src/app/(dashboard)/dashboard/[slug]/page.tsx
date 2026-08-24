"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useWorkspace, useWorkspaceMembers } from "@/hooks/useWorkspace";
import { useMe } from "@/hooks/useAuth";
import {
  useDocuments,
  useCreateDocument,
  useDeleteDocument,
} from "@/hooks/useDocument";
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
import { Plus, FileText, ChevronRight, Loader2 } from "lucide-react";
import { AxiosError } from "axios";
import type { Document } from "@/types/api";
import type { ApiError } from "@/types/api";
import { Users, Trash2 } from "lucide-react";

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const { data: workspace, isLoading: workspaceLoading } = useWorkspace(slug);
  const { data: documents, isLoading: documentsLoading } = useDocuments(
    workspace?.id || "",
  );
  const { mutate: createDocument, isPending: creating } = useCreateDocument();
  const { mutate: deleteDocument, isPending: deleting } = useDeleteDocument();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [documentTitle, setDocumentTitle] = useState("");

  const { data: currentUser } = useMe();
  const { data: members } = useWorkspaceMembers(slug);

  const currentUserRole = members?.find(
    (m: any) => m.user.id === currentUser?.id,
  )?.role;

  const canEdit = currentUserRole === "OWNER" || currentUserRole === "EDITOR";

  const handleCreateDocument = () => {
    if (!workspace) return;

    createDocument(
      {
        title: documentTitle.trim() || "Untitled",
        workspaceId: workspace.id,
      },
      {
        onSuccess: (data) => {
          toast.success("Document created!");
          setShowCreateModal(false);
          setDocumentTitle("");
          router.push(`/dashboard/${slug}/doc/${data.id}`);
        },
        onError: (error: Error) => {
          const axiosError = error as AxiosError<ApiError>;
          toast.error(
            axiosError.isAxiosError
              ? axiosError.response?.data?.message ||
                  "Failed to create document"
              : error.message || "Failed to create document",
          );
        },
      },
    );
  };

  const handleDeleteDocument = (documentId: string, title: string) => {
    if (!confirm(`Delete "${title || "Untitled"}"? This cannot be undone.`))
      return;

    deleteDocument(documentId, {
      onSuccess: () => toast.success("Document deleted"),
      onError: (error: Error) => {
        const axiosError = error as AxiosError<ApiError>;
        toast.error(
          axiosError.isAxiosError
            ? axiosError.response?.data?.message || "Failed to delete document"
            : error.message || "Failed to delete document",
        );
      },
    });
  };

  if (workspaceLoading) {
    return (
      <div className="p-8">
        <div className="space-y-3">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Workspace not found.</p>
      </div>
    );
  }

  return (
    <>
      <div className="p-8">
        {/* Workspace header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {workspace.name}
            </h1>
            {workspace.description && (
              <p className="text-gray-500 mt-1">{workspace.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/${slug}/members`}>
              <Button variant="outline" className="gap-2">
                <Users className="h-4 w-4" />
                Members
              </Button>
            </Link>
            {canEdit && (
              <Button
                onClick={() => setShowCreateModal(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                New document
              </Button>
            )}
          </div>
        </div>

        {/* Documents list */}
        {documentsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-14 bg-white border border-gray-200 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : documents?.length === 0 ? (
          <div className="text-center py-16 bg-white border border-gray-200 border-dashed rounded-xl">
            <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium mb-1">No documents yet</p>
            <p className="text-gray-400 text-sm mb-4">
              Create your first document to get started
            </p>
            {canEdit && (
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Create document
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {documents?.map((doc: Document) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all group"
              >
                <Link
                  href={`/dashboard/${slug}/doc/${doc.id}`}
                  className="flex items-center gap-3 flex-1 min-w-0"
                >
                  <span className="text-lg shrink-0">{doc.emoji || "📝"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {doc.title || "Untitled"}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {doc._count?.children && doc._count.children > 0
                        ? `${doc._count.children} sub-pages · `
                        : ""}
                      Updated {new Date(doc.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
                </Link>

                {/* Delete button — shows on hover */}
                {canEdit && (
                  <button
                    onClick={() => handleDeleteDocument(doc.id, doc.title)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded hover:bg-red-50 hover:text-red-500 text-gray-400 shrink-0"
                    title="Delete document"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create document modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
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
              onClick={() => setShowCreateModal(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateDocument}
              disabled={creating}
              className="gap-2"
            >
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              {creating ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
