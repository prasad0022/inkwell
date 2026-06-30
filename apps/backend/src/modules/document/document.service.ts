import { prisma } from "../../lib/prisma";

export interface CreateDocumentInput {
  title?: string;
  workspaceId: string;
  createdById: string;
  parentId?: string;
  emoji?: string;
}

export interface UpdateDocumentInput {
  title?: string;
  content?: any;
  emoji?: string;
  isPublic?: boolean;
}

export const createDocument = async (input: CreateDocumentInput) => {
  const { title, workspaceId, createdById, parentId, emoji } = input;

  // Verify workspace exists and user is a member
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: { members: true },
  });

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  const isMember = workspace.members.find((m: any) => m.userId === createdById);

  if (!isMember) {
    throw new Error("You do not have access to this workspace");
  }

  if (isMember.role === "VIEWER") {
    throw new Error("Viewers cannot create documents");
  }

  // If parentId provided, verify parent document exists
  if (parentId) {
    const parentDoc = await prisma.document.findUnique({
      where: { id: parentId },
    });

    if (!parentDoc) {
      throw new Error("Parent document not found");
    }

    if (parentDoc.workspaceId !== workspaceId) {
      throw new Error("Parent document belongs to a different workspace");
    }
  }

  const document = await prisma.document.create({
    data: {
      title: title || "Untitled",
      workspaceId,
      createdById,
      parentId: parentId || null,
      emoji: emoji || null,
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
      children: {
        select: {
          id: true,
          title: true,
          emoji: true,
          createdAt: true,
        },
      },
    },
  });

  // Log activity
  await prisma.activity.create({
    data: {
      action: "DOCUMENT_CREATED",
      userId: createdById,
      workspaceId,
      documentId: document.id,
    },
  });

  return document;
};

export const getWorkspaceDocuments = async (workspaceId: string) => {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: { members: true },
  });

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  // Get only root documents (no parent) — children are nested inside
  const documents = await prisma.document.findMany({
    where: {
      workspaceId,
      parentId: null,
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
      children: {
        select: {
          id: true,
          title: true,
          emoji: true,
          parentId: true,
          createdAt: true,
          children: {
            select: {
              id: true,
              title: true,
              emoji: true,
              parentId: true,
              createdAt: true,
            },
          },
        },
      },
      _count: {
        select: { children: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return documents;
};

export const getDocumentById = async (documentId: string) => {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
      workspace: {
        include: {
          members: true,
        },
      },
      children: {
        select: {
          id: true,
          title: true,
          emoji: true,
          parentId: true,
          createdAt: true,
        },
      },
      parent: {
        select: {
          id: true,
          title: true,
          emoji: true,
        },
      },
    },
  });

  if (!document) {
    throw new Error("Document not found");
  }

  return document;
};

export const updateDocument = async (
  documentId: string,
  userId: string,
  input: UpdateDocumentInput,
) => {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      workspace: {
        include: { members: true },
      },
    },
  });

  if (!document) {
    throw new Error("Document not found");
  }

  const updated = await prisma.document.update({
    where: { id: documentId },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.content !== undefined && { content: input.content }),
      ...(input.emoji !== undefined && { emoji: input.emoji }),
      ...(input.isPublic !== undefined && { isPublic: input.isPublic }),
    },
    include: {
      createdBy: {
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
      action: "DOCUMENT_UPDATED",
      userId,
      workspaceId: document.workspaceId,
      documentId,
    },
  });

  return updated;
};

export const deleteDocument = async (documentId: string, userId: string) => {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      workspace: {
        include: { members: true },
      },
    },
  });

  if (!document) {
    throw new Error("Document not found");
  }

  // Log activity before deletion
  await prisma.activity.create({
    data: {
      action: "DOCUMENT_DELETED",
      userId,
      workspaceId: document.workspaceId,
      documentId: null,
    },
  });

  // Delete document (children cascade automatically via Prisma schema)
  await prisma.document.delete({
    where: { id: documentId },
  });

  return { message: "Document deleted successfully" };
};
