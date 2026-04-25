import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getRequests,
  deleteRequest,
  saveRequest,
  addRequestToCollection,
  type Request,
} from "@/actions/requests/index";

// Add request to collection
export function useAddRequestToCollection(collectionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: Request) =>
      addRequestToCollection(collectionId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

// Get Requests
export const useGetRequests = (collectionId: string) => {
  return useQuery({
    queryKey: ["requests", collectionId],
    queryFn: () => getRequests(collectionId),
  });
};

// Save request
export function useSaveRequest(id:string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ( request: Request) =>
      saveRequest(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

// Delete Request
export const useDeleteRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => deleteRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};
