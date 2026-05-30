import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getRequests,
  deleteRequest,
  saveRequest,
  addRequestToCollection,
  type Request,
  sendRequest,
  run,
} from "@/actions/requests/index";
import {
  useRequestPlaygroundStore,
  type ResponseData,
} from "@/store/request/useRequestStore";

type RunResult = Awaited<ReturnType<typeof run>>;

function normalizeRunResult(data: RunResult): ResponseData | null {
  if (!data || !("requestRun" in data) || !data.requestRun) {
    return null;
  }

  const { requestRun } = data;
  const rawHeaders = requestRun.headers;
  const headers =
    rawHeaders &&
    typeof rawHeaders === "object" &&
    !Array.isArray(rawHeaders)
      ? (rawHeaders as Record<string, string>)
      : {};

  let result: ResponseData["result"];
  if ("response" in data && data.response) {
    const response = data.response;
    if ("status" in response) {
      result = {
        status: response.status,
        statusText: response.statusText,
        duration: response.durationMs,
        size: response.size,
      };
    } else if ("error" in response) {
      result = {
        duration: response.durationMs,
        size: response.size,
      };
    }
  }

  return {
    success: data.success,
    requestRun: {
      id: requestRun.id,
      requestId: requestRun.requestId,
      status: requestRun.status,
      statusText: requestRun.statusText ?? "",
      headers,
      body: requestRun.body as ResponseData["requestRun"]["body"],
      durationMs: requestRun.durationMs ?? 0,
      createdAt:
        requestRun.createdAt instanceof Date
          ? requestRun.createdAt.toISOString()
          : String(requestRun.createdAt),
    },
    result,
  };
}

// Add request to collection
export function useAddRequestToCollection(collectionId: string) {
  const queryClient = useQueryClient();
  const { updateTabFromSavedRequest, activeTabId } =
    useRequestPlaygroundStore();
  return useMutation({
    mutationFn: (request: Request) =>
      addRequestToCollection(collectionId, request),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      if (data && activeTabId) {
        // @ts-ignore
        updateTabFromSavedRequest(activeTabId, data);
      }
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
export function useSaveRequest(id: string) {
  const queryClient = useQueryClient();
  const { updateTabFromSavedRequest, activeTabId } =
    useRequestPlaygroundStore();
  return useMutation({
    mutationFn: (request: Request) => saveRequest(id, request),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      if (data && activeTabId) {
        // @ts-ignore
        updateTabFromSavedRequest(activeTabId, data);
      }
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

// send request hook
export function useRunRequest(requestId: string) {
  const queryClient = useQueryClient();
  const { setResponseViewerData } = useRequestPlaygroundStore();
  return useMutation({
    mutationFn: async () => await run(requestId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      const normalized = normalizeRunResult(data);
      if (!normalized) {
        const message =
          data && "error" in data && typeof data.error === "string"
            ? data.error
            : "Request ran but the response could not be loaded. Save the request and try again.";
        toast.error(message);
        return;
      }
      setResponseViewerData(normalized);
      if (normalized.success) {
        toast.success("Request sent successfully!");
      } else {
        toast.error(
          normalized.requestRun.statusText ?? "Request failed",
        );
      }
    },
    onError: (error) => {
      toast.error("Failed to send request.");
    },
  });
}
