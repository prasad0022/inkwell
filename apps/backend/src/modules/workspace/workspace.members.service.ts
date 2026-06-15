import { prisma } from "../../lib/prisma";
import { WorkspaceRole } from "@prisma/client";

export interface InviteMemberInput {
  workspaceSlug: string;
  email: string;
  role: WorkspaceRole;
  inviterId: string;
}

export interface UpdateMemberRoleInput {
  workspaceSlug: string;
  memberId: string;
  role: WorkspaceRole;
  requesterId: string;
}

export interface RemoveMemberInput {
  workspaceSlug: string;
  memberId: string;
  requesterId: string;
}

export const inviteMember = async (input: InviteMemberInput) => {
  const { workspaceSlug, email, role, inviterId } = input;

  // Get workspace
  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
    include: { members: true },
  });

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  // Only owner can invite
  if (workspace.ownerId !== inviterId) {
    throw new Error("Only the workspace owner can invite members");
  }

  // Find user by email
  const userToInvite = await prisma.user.findUnique({
    where: { email },
  });

  if (!userToInvite) {
    throw new Error("No user found with that email address");
  }

  // Check if already a member
  const alreadyMember = workspace.members.some(
    (m) => m.userId === userToInvite.id,
  );

  if (alreadyMember) {
    throw new Error("User is already a member of this workspace");
  }

  // Can't invite as OWNER
  if (role === "OWNER") {
    throw new Error("Cannot invite a member as owner");
  }

  // Add member
  const member = await prisma.workspaceMember.create({
    data: {
      workspaceId: workspace.id,
      userId: userToInvite.id,
      role,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
    },
  });

  // Log activity
  await prisma.activity.create({
    data: {
      action: "MEMBER_INVITED",
      userId: inviterId,
      workspaceId: workspace.id,
    },
  });

  return member;
};

export const getWorkspaceMembers = async (
  workspaceSlug: string,
  requesterId: string,
) => {
  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      },
    },
  });

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  // Check requester is a member
  const isMember = workspace.members.some((m) => m.userId === requesterId);
  if (!isMember) {
    throw new Error("You do not have access to this workspace");
  }

  return workspace.members;
};

export const updateMemberRole = async (input: UpdateMemberRoleInput) => {
  const { workspaceSlug, memberId, role, requesterId } = input;

  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
  });

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  // Only owner can update roles
  if (workspace.ownerId !== requesterId) {
    throw new Error("Only the workspace owner can update member roles");
  }

  // Can't change owner's role
  if (memberId === workspace.ownerId) {
    throw new Error("Cannot change the role of the workspace owner");
  }

  // Can't assign OWNER role
  if (role === "OWNER") {
    throw new Error("Cannot assign owner role to a member");
  }

  // Find the member
  const existingMember = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId: workspace.id,
      userId: memberId,
    },
  });

  if (!existingMember) {
    throw new Error("Member not found in this workspace");
  }

  const updated = await prisma.workspaceMember.update({
    where: { id: existingMember.id },
    data: { role },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
    },
  });

  return updated;
};

export const removeMember = async (input: RemoveMemberInput) => {
  const { workspaceSlug, memberId, requesterId } = input;

  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
  });

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  // Owner can remove anyone, members can remove themselves
  const isSelf = memberId === requesterId;
  const isOwner = workspace.ownerId === requesterId;

  if (!isSelf && !isOwner) {
    throw new Error("You do not have permission to remove this member");
  }

  // Can't remove the owner
  if (memberId === workspace.ownerId) {
    throw new Error("Cannot remove the workspace owner");
  }

  // Find the member
  const existingMember = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId: workspace.id,
      userId: memberId,
    },
  });

  if (!existingMember) {
    throw new Error("Member not found in this workspace");
  }

  await prisma.workspaceMember.delete({
    where: { id: existingMember.id },
  });

  // Log activity
  await prisma.activity.create({
    data: {
      action: "MEMBER_REMOVED",
      userId: requesterId,
      workspaceId: workspace.id,
    },
  });

  return { message: "Member removed successfully" };
};
