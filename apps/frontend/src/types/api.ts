export interface ApiError {
  message: string;
  success: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    members: number;
    documents: number;
  };
  members?: {
    role: "OWNER" | "EDITOR" | "VIEWER";
  }[];
}

export interface Document {
  id: string;
  title: string;
  emoji: string | null;
  isPublic: boolean;
  workspaceId: string;
  createdById: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    children: number;
  };
  children?: Document[];
}
