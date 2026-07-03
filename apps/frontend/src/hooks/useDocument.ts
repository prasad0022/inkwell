import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  documentApi,
  CreateDocumentInput,
  UpdateDocumentInput,
} from "@/lib/api/document.api";
import type { Document } from "@/types/api";

export const useDocuments = (workspaceId: string) => {
  return useQuery<Document[]>({
    queryKey: ["documents", workspaceId],
    queryFn: () => documentApi.getByWorkspace(workspaceId),
    enabled: !!workspaceId,
  });
};

export const useDocument = (documentId: string) => {
  return useQuery<Document>({
    queryKey: ["document", documentId],
    queryFn: () => documentApi.getOne(documentId),
    enabled: !!documentId,
  });
};

export const useCreateDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDocumentInput) => documentApi.create(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["documents", data.workspaceId],
      });
    },
  });
};

export const useUpdateDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      documentId,
      input,
    }: {
      documentId: string;
      input: UpdateDocumentInput;
    }) => documentApi.update(documentId, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["document", data.id] });
      queryClient.invalidateQueries({
        queryKey: ["documents", data.workspaceId],
      });
    },
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: string) => documentApi.delete(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
};
