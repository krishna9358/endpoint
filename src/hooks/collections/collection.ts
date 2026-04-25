import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCollection,
  deleteCollection,
  getCollections,
  updateCollection,
} from "@/actions/collections";
import { toast } from "sonner";

// Creating a collection

export const useCreateCollection = (workspaceId: string, name: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => createCollection(name, workspaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections", workspaceId] });
      toast.success("Collection created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create collection");
    },
  });
};

// Getting all the collections

export const useGetCollections = (workspaceId: string) => {
  return useQuery({
    queryKey: ["collections", workspaceId],
    queryFn: () => getCollections(workspaceId),
    enabled: !!workspaceId,
  });
};

// Deleting a collection

export const useDeleteCollection = (workspaceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (collectionId: string) => deleteCollection(collectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections", workspaceId] });
      toast.success("Collection deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete collection");
    },
  });
};

// Updating a collection

export const useUpdateCollection = (workspaceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      collectionId,
      name,
    }: {
      collectionId: string;
      name: string;
    }) => updateCollection(collectionId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections", workspaceId] });
      toast.success("Collection updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update collection");
    },
  });
};
