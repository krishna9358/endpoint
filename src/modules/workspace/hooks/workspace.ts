import { useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import { createWorkspaces, getWorkspaceById, getWorkspaces } from "../actions";
import { Workspace } from "@prisma/client";


// hook for getting workspace
export function useWorkspaces(){
    return useQuery<Workspace[]>({
        queryKey : ["workspaces"],
        queryFn: async () => getWorkspaces(),
    })
}

// hook for creating workspace
export function useCreateWorkspace(){
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (name : string ) => createWorkspaces(name),
        onSuccess : ()=>{
            queryClient.invalidateQueries({queryKey:["workspaces"]})
        }
    })
}

// hook for getting workspace by id
export function useGettingWorkgspaceById(id : string){
    return useQuery({
        queryKey: ["workspaces"],
        queryFn: async () => getWorkspaceById(id)
    })
}