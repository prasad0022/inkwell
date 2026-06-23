import { prisma } from "../../lib/prisma";

export interface CreateWorkspaceInput {
  name: string;
  description?: string;
  userId: string;
}

export interface UpdateWorkspaceInput {
  name?: string;
  description?: string;
}

// Generate a URL-friendly slug from workspace name
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

export const createWorkspace = async (input: CreateWorkspaceInput) => {
  const { name, description, userId } = input;

  // Generate unique slug
  const baseSlug = generateSlug(name);
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  const slug = `${baseSlug}-${randomSuffix}`;

  const workspace = await prisma.workspace.create({
    data: {
      name,
      description,
      slug,
      ownerId: userId,
      members: {
        create: {
          userId,
          role: "OWNER",
        },
      },
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
      _count: {
        select: {
          members: true,
          documents: true,
        },
      },
    },
  });

  return workspace;
};

export const getUserWorkspaces = async (userId: string) => {
  const workspaces = await prisma.workspace.findMany({
    where: {
      members: {
        some: {
          userId,
        },
      },
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
      members: {
        where: { userId },
        select: { role: true },
      },
      _count: {
        select: {
          members: true,
          documents: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return workspaces;
};

export const getWorkspaceBySlug = async (slug: string, userId: string) => {
  const workspace = await prisma.workspace.findUnique({
    where: { slug },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
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
      _count: {
        select: {
          documents: true,
        },
      },
    },
  });

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  // Check if user is a member
  const isMember = workspace.members.some((m: any) => m.userId === userId);
  if (!isMember) {
    throw new Error("You do not have access to this workspace");
  }

  return workspace;
};

export const updateWorkspace = async (
  slug: string,
  userId: string,
  input: UpdateWorkspaceInput,
) => {
  // Check if workspace exists and user is owner
  const workspace = await prisma.workspace.findUnique({
    where: { slug },
  });

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  if (workspace.ownerId !== userId) {
    throw new Error("Only the workspace owner can update it");
  }

  const updated = await prisma.workspace.update({
    where: { slug },
    data: input,
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
      _count: {
        select: {
          members: true,
          documents: true,
        },
      },
    },
  });

  return updated;
};

export const deleteWorkspace = async (slug: string, userId: string) => {
  const workspace = await prisma.workspace.findUnique({
    where: { slug },
  });

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  if (workspace.ownerId !== userId) {
    throw new Error("Only the workspace owner can delete it");
  }

  await prisma.workspace.delete({
    where: { slug },
  });

  return { message: "Workspace deleted successfully" };
};
