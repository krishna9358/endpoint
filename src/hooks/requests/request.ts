import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getRequests, deleteRequest, saveRequest, addRequestToCollection, type Request  } from "@/actions/requests/index";

// Add request to collection
export function useAddRequestToCollection(){
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({collectionId , request}: {collectionId : string, request : Request}) => addRequestToCollection(collectionId, request),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["requests"] });
            toast.success("Request added successfully");
        },
        onError: (error) => {
            toast.error(error.message);
        }
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
export function useSaveRequest(){
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({id, request}: {id : string, request : Request}) => saveRequest(id, request),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["requests"] });
            toast.success("Request saved successfully");
        },
        onError: (error) => {
            toast.error(error.message);
        }
    });
}


// Delete Request
export const useDeleteRequest = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (requestId: string) => deleteRequest(requestId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["requests"] });
            toast.success("Request deleted successfully");
        },
        onError: (error) => {
            toast.error(error.message);
        }
    });
};