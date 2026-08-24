import apiClient from "../axios";

export interface CreateWorkspaceInput {
  name: string;
  description?: string;
}

export interface UpdateWorkspaceInput {
  name?: string;
  description?: string;
}

export interface InviteMemberInput {
  email: string;
  role: "EDITOR" | "VIEWER";
}

export const workspaceApi = {
  create: async (input: CreateWorkspaceInput) => {
    const { data } = await apiClient.post("/api/workspaces", input);
    return data.data;
  },

  getAll: async () => {
    const { data } = await apiClient.get("/api/workspaces");
    return data.data;
  },

  getOne: async (slug: string) => {
    const { data } = await apiClient.get(`/api/workspaces/${slug}`);
    return data.data;
  },

  update: async (slug: string, input: UpdateWorkspaceInput) => {
    const { data } = await apiClient.patch(`/api/workspaces/${slug}`, input);
    return data.data;
  },

  delete: async (slug: string) => {
    const { data } = await apiClient.delete(`/api/workspaces/${slug}`);
    return data.data;
  },

  inviteMember: async (slug: string, input: InviteMemberInput) => {
    const { data } = await apiClient.post(
      `/api/workspaces/${slug}/members`,
      input,
    );
    return data.data;
  },

  getMembers: async (slug: string) => {
    const { data } = await apiClient.get(`/api/workspaces/${slug}/members`);
    return data.data;
  },

  updateMemberRole: async (
    slug: string,
    memberId: string,
    role: "EDITOR" | "VIEWER",
  ) => {
    const { data } = await apiClient.patch(
      `/api/workspaces/${slug}/members/${memberId}`,
      { role },
    );
    return data.data;
  },

  removeMember: async (slug: string, memberId: string) => {
    const { data } = await apiClient.delete(
      `/api/workspaces/${slug}/members/${memberId}`,
    );
    return data.data;
  },
};
