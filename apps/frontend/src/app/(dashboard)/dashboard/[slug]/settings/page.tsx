"use client";

import { useState, useEffect, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useWorkspace,
  useUpdateWorkspace,
  useDeleteWorkspace,
} from "@/hooks/useWorkspace";
import { useMe } from "@/hooks/useAuth";
import { useWorkspaceMembers } from "@/hooks/useWorkspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import type { ApiError, WorkspaceMember } from "@/types/api";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";

export default function WorkspaceSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const { data: workspace, isLoading } = useWorkspace(slug);
  const { data: members } = useWorkspaceMembers(slug);
  const { data: currentUser } = useMe();
  const { mutate: updateWorkspace, isPending: updating } = useUpdateWorkspace();
  const { mutate: deleteWorkspace, isPending: deleting } = useDeleteWorkspace();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");

  // Check if current user is owner
  const isOwner = members?.some(
    (m: WorkspaceMember) => m.user.id === currentUser?.id && m.role === "OWNER",
  );

  // Load workspace data into form
  useEffect(() => {
    if (workspace) {
      setName(workspace.name || "");
      setDescription(workspace.description || "");
    }
  }, [workspace?.slug]);

  const handleUpdate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Workspace name is required");
      return;
    }

    updateWorkspace(
      {
        slug,
        input: {
          name: name.trim(),
          description: description.trim() || undefined,
        },
      },
      {
        onSuccess: (data) => {
          toast.success("Workspace updated");
          // If slug changed (name changed) redirect to new slug
          if (data.slug !== slug) {
            router.push(`/dashboard/${data.slug}/settings`);
          }
        },
        onError: (err: Error) => {
          toast.error(
            (isAxiosError<ApiError>(err) && err.response?.data?.message) ||
              "Failed to update workspace",
          );
        },
      },
    );
  };

  const handleDelete = () => {
    if (deleteConfirm !== workspace?.name) {
      toast.error("Workspace name does not match");
      return;
    }

    deleteWorkspace(slug, {
      onSuccess: () => {
        toast.success("Workspace deleted");
        router.push("/dashboard");
      },
      onError: (err: Error) => {
        toast.error(
          (isAxiosError<ApiError>(err) && err.response?.data?.message) ||
            "Failed to delete workspace",
        );
      },
    });
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-xl space-y-4">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="p-8">
        <div className="max-w-xl">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
            <p className="text-amber-700 font-medium">
              Only workspace owners can access settings
            </p>
            <Link href={`/dashboard/${slug}`}>
              <Button variant="outline" className="mt-4">
                Back to workspace
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href={`/dashboard/${slug}`}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-500 text-sm mt-0.5">{workspace?.name}</p>
          </div>
        </div>

        {/* General settings */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            General
          </h2>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Workspace name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Workspace"
                disabled={updating}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">
                Description{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this workspace for?"
                disabled={updating}
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={updating} className="gap-2">
                {updating && <Loader2 className="h-4 w-4 animate-spin" />}
                {updating ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        </div>

        {/* Danger zone */}
        <div className="bg-white border border-red-200 rounded-xl p-6">
          <h2 className="text-base font-semibold text-red-600 mb-1">
            Danger zone
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Deleting a workspace permanently removes all documents and member
            access. This cannot be undone.
          </p>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="deleteConfirm">
                Type{" "}
                <span className="font-mono font-semibold text-gray-900">
                  {workspace?.name}
                </span>{" "}
                to confirm
              </Label>
              <Input
                id="deleteConfirm"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder={workspace?.name}
                disabled={deleting}
                className="border-red-200 focus-visible:ring-red-400"
              />
            </div>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting || deleteConfirm !== workspace?.name}
              className="gap-2"
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              <Trash2 className="h-4 w-4" />
              {deleting ? "Deleting..." : "Delete workspace"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
