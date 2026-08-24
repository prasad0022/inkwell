"use client";

import { useState, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useWorkspace,
  useWorkspaceMembers,
  useInviteMember,
  useUpdateMemberRole,
  useRemoveMember,
} from "@/hooks/useWorkspace";
import { useMe } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import type { ApiError, WorkspaceMember } from "@/types/api";
import {
  ArrowLeft,
  Plus,
  MoreHorizontal,
  Shield,
  Eye,
  UserMinus,
  Loader2,
  Crown,
} from "lucide-react";
import Link from "next/link";

const roleConfig = {
  OWNER: {
    label: "Owner",
    icon: Crown,
    color: "text-amber-600 bg-amber-50",
  },
  EDITOR: {
    label: "Editor",
    icon: Shield,
    color: "text-blue-600 bg-blue-50",
  },
  VIEWER: {
    label: "Viewer",
    icon: Eye,
    color: "text-gray-600 bg-gray-100",
  },
};

export default function MembersPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const { data: workspace } = useWorkspace(slug);
  const { data: members, isLoading } = useWorkspaceMembers(slug);
  const { data: currentUser } = useMe();

  const { mutate: inviteMember, isPending: inviting } = useInviteMember();
  const { mutate: updateRole, isPending: updatingRole } = useUpdateMemberRole();
  const { mutate: removeMember, isPending: removing } = useRemoveMember();

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"EDITOR" | "VIEWER">("EDITOR");

  const isOwner = members?.some(
    (m: WorkspaceMember) => m.user.id === currentUser?.id && m.role === "OWNER",
  );

  const handleInvite = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!inviteEmail.trim()) {
      toast.error("Email is required");
      return;
    }

    inviteMember(
      { slug, input: { email: inviteEmail.trim(), role: inviteRole } },
      {
        onSuccess: () => {
          toast.success(`${inviteEmail} invited as ${inviteRole}`);
          setShowInviteModal(false);
          setInviteEmail("");
          setInviteRole("EDITOR");
        },
        onError: (err: Error) => {
          const message = isAxiosError<ApiError>(err)
            ? err.response?.data?.message
            : err.message;
          toast.error(message || "Failed to invite member");
        },
      },
    );
  };

  const handleUpdateRole = (memberId: string, role: "EDITOR" | "VIEWER") => {
    updateRole(
      { slug, memberId, role },
      {
        onSuccess: () => toast.success("Role updated"),
        onError: (err: Error) => {
          const message = isAxiosError<ApiError>(err)
            ? err.response?.data?.message
            : err.message;
          toast.error(message || "Failed to update role");
        },
      },
    );
  };

  const handleRemove = (memberId: string, memberName: string) => {
    if (!confirm(`Remove ${memberName} from this workspace?`)) return;

    removeMember(
      { slug, memberId },
      {
        onSuccess: () => toast.success(`${memberName} removed`),
        onError: (err: Error) => {
          const message = isAxiosError<ApiError>(err)
            ? err.response?.data?.message
            : err.message;
          toast.error(message || "Failed to remove member");
        },
      },
    );
  };

  return (
    <>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href={`/dashboard/${slug}`}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Members</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {workspace?.name} · {members?.length || 0} members
            </p>
          </div>
          {isOwner && (
            <Button onClick={() => setShowInviteModal(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Invite member
            </Button>
          )}
        </div>

        {/* Members list */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-gray-200 animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-48 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {members?.map((member: WorkspaceMember) => {
                const config = roleConfig[member.role];
                const RoleIcon = config.icon;
                const isCurrentUser = member.user.id === currentUser?.id;
                const canManage = isOwner && member.role !== "OWNER";

                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-4 px-6 py-4"
                  >
                    {/* Avatar */}
                    <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                      <span className="text-sm font-medium text-gray-600">
                        {member.user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* User info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {member.user.name}
                        </p>
                        {isCurrentUser && (
                          <span className="text-xs text-gray-400">(you)</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate">
                        {member.user.email}
                      </p>
                    </div>

                    {/* Role badge */}
                    <div
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}
                    >
                      <RoleIcon className="h-3 w-3" />
                      {config.label}
                    </div>

                    {/* Actions — only for owner, not on themselves */}
                    {canManage && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            disabled={updatingRole || removing}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {member.role !== "EDITOR" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleUpdateRole(member.user.id, "EDITOR")
                              }
                            >
                              <Shield className="h-4 w-4 mr-2 text-blue-500" />
                              Make Editor
                            </DropdownMenuItem>
                          )}
                          {member.role !== "VIEWER" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleUpdateRole(member.user.id, "VIEWER")
                              }
                            >
                              <Eye className="h-4 w-4 mr-2 text-gray-500" />
                              Make Viewer
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() =>
                              handleRemove(member.user.id, member.user.name)
                            }
                            className="text-red-600 focus:text-red-600"
                          >
                            <UserMinus className="h-4 w-4 mr-2" />
                            Remove member
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Joined date info */}
        <p className="text-xs text-gray-400 mt-4 px-1">
          Only workspace owners can invite and manage members.
        </p>
      </div>

      {/* Invite modal */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite a member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInvite}>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Email address
                </label>
                <Input
                  type="email"
                  placeholder="colleague@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Role
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setInviteRole("EDITOR")}
                    className={`flex-1 flex items-center gap-2 p-3 rounded-lg border text-sm transition-colors ${
                      inviteRole === "EDITOR"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <Shield className="h-4 w-4" />
                    <div className="text-left">
                      <p className="font-medium">Editor</p>
                      <p className="text-xs opacity-70">
                        Can create and edit docs
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInviteRole("VIEWER")}
                    className={`flex-1 flex items-center gap-2 p-3 rounded-lg border text-sm transition-colors ${
                      inviteRole === "VIEWER"
                        ? "border-gray-500 bg-gray-50 text-gray-700"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <Eye className="h-4 w-4" />
                    <div className="text-left">
                      <p className="font-medium">Viewer</p>
                      <p className="text-xs opacity-70">Can only read docs</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowInviteModal(false)}
                disabled={inviting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={inviting} className="gap-2">
                {inviting && <Loader2 className="h-4 w-4 animate-spin" />}
                {inviting ? "Inviting..." : "Send invite"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
