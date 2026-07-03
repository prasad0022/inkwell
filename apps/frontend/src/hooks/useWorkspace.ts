import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { workspaceApi, CreateWorkspaceInput } from "@/lib/api/workspace.api";
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
