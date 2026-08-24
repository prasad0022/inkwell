import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  workspaceApi,
  CreateWorkspaceInput,
  InviteMemberInput,
} from "@/lib/api/workspace.api";
import { Workspace } from "@/types/api";

export const useWorkspaces = () => {
  return useQuery<Workspace[]>({
    queryKey: ["workspaces"],
    queryFn: workspaceApi.getAll,
  });
};

export const useWorkspace = (slug: string) => {
  return useQuery<Workspace>({
    queryKey: ["workspace", slug],
    queryFn: () => workspaceApi.getOne(slug),
    enabled: !!slug,
  });
};

export const useCreateWorkspace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateWorkspaceInput) => workspaceApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
};

export const useDeleteWorkspace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (slug: string) => workspaceApi.delete(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
};

export const useWorkspaceMembers = (slug: string) => {
  return useQuery({
    queryKey: ["workspace-members", slug],
    queryFn: () => workspaceApi.getMembers(slug),
    enabled: !!slug,
  });
};

export const useInviteMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ slug, input }: { slug: string; input: InviteMemberInput }) =>
      workspaceApi.inviteMember(slug, input),
    onSuccess: (_, { slug }) => {
      queryClient.invalidateQueries({ queryKey: ["workspace-members", slug] });
    },
  });
};

export const useUpdateMemberRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      slug,
      memberId,
      role,
    }: {
      slug: string;
      memberId: string;
      role: "EDITOR" | "VIEWER";
    }) => workspaceApi.updateMemberRole(slug, memberId, role),
    onSuccess: (_, { slug }) => {
      queryClient.invalidateQueries({ queryKey: ["workspace-members", slug] });
    },
  });
};

export const useRemoveMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ slug, memberId }: { slug: string; memberId: string }) =>
      workspaceApi.removeMember(slug, memberId),
    onSuccess: (_, { slug }) => {
      queryClient.invalidateQueries({ queryKey: ["workspace-members", slug] });
    },
  });
};
