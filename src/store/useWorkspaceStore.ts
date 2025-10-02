import { create } from "zustand";

// store for the workspace
type Workspace = {
  id: string;
  name: string;
};

interface WorkspaceState {
  selectedWorkspace: Workspace | null;
  setSelectedWorkspace: (workspace: Workspace) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  selectedWorkspace: null,
  setSelectedWorkspace: (workspace: Workspace) =>
    set({ selectedWorkspace: workspace }),
}));
