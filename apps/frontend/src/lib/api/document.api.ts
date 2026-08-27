import apiClient from "../axios";

export interface CreateDocumentInput {
  title?: string;
  workspaceId: string;
  parentId?: string;
  emoji?: string;
}

export interface UpdateDocumentInput {
  title?: string;
  content?: Record<string, unknown>;
  emoji?: string;
  isPublic?: boolean;
}

export interface SearchResult {
  id: string;
  title: string;
  emoji: string | null;
  excerpt: string;
  workspaceId: string;
  updatedAt: string;
}

export const documentApi = {
  create: async (input: CreateDocumentInput) => {
    const { data } = await apiClient.post("/api/documents", input);
    return data.data;
  },

  getByWorkspace: async (workspaceId: string) => {
    const { data } = await apiClient.get(
      `/api/documents/workspace/${workspaceId}`,
    );
    return data.data;
  },

  getOne: async (documentId: string) => {
    const { data } = await apiClient.get(`/api/documents/${documentId}`);
    return data.data;
  },

  update: async (documentId: string, input: UpdateDocumentInput) => {
    const { data } = await apiClient.patch(
      `/api/documents/${documentId}`,
      input,
    );
    return data.data;
  },

  delete: async (documentId: string) => {
    const { data } = await apiClient.delete(`/api/documents/${documentId}`);
    return data.data;
  },

  search: async (
    workspaceId: string,
    query: string,
  ): Promise<SearchResult[]> => {
    const { data } = await apiClient.get(
      `/api/documents/search/${workspaceId}`,
      { params: { q: query } },
    );
    return data.data;
  },
};
