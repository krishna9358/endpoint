import { create } from "zustand";
import { nanoid } from "nanoid";


type HeaderMap = Record<string, string>;

interface RequestRun{
  id: string;
  requestId: string;
  status: number;
  statusText: string;
  headers?: HeaderMap;
  body?: string | object | null;
  durationMs: number;
  createdAt: Date;

}


interface Result{
  status?: number;
  statusText?: string;
  duration?: number;
  size?: number;
}

export interface ResponseData {
  success: boolean;
  requestRun: RequestRun;
  result? : Result;
}

export type RequestTab = {
  id: string;
  title: string;
  method: string;
  url: string;
  body?: string;
  headers?: string;
  parameters: string;
  unsavedChanges: boolean;
  requestId?: string;
  collectionId?: string;
  workspaceId?: string;
  responseViewerData?: ResponseData | null;
  setResponseViewerData: (data: ResponseData) => void;
};

type SavedRequest = {
  id: string;
  name: string;
  method: string;
  url: string;
  headers?: string;
  body?: string;
  parameters?: string;
};

type playgroundState = {
  tabs: RequestTab[];
  activeTabId: string | null;
  addTab: () => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateTab: (id: string, data: Partial<RequestTab>) => void;
  markUnsaved: (id: string, value: boolean) => void;
  openRequestTab: (request: any) => void;
  updateTabFromSavedRequest: (
    tabId: string,
    savedRequest: SavedRequest,
  ) => void;
  responseViewerData: ResponseData | null;
  setResponseViewerData: (data: ResponseData) => void;
};

export const useRequestPlaygroundStore = create<playgroundState>((set) => ({
  responseViewerData: null,
  setResponseViewerData: (data: ResponseData) => {
    set({ responseViewerData: data });
  },
  tabs: [],
  activeTabId: null,
  addTab: () => {
    set((state) => {
      const newTab: RequestTab = {
        id: nanoid(),
        title: "Untitled",
        method: "GET",
        url: "https://krishna-mohan.vercel.app",
        body: "",
        headers: "",
        parameters: "",
        unsavedChanges: true,
        // setResponseViewerData: () => {},
      };
      return {
        tabs: [...state.tabs, newTab],
        activeTabId: newTab.id,
      };
    });
  },
  closeTab: (id: string) => {
    set((state) => {
      const index = state.tabs.findIndex((t) => t.id === id);
      const newTabs = state.tabs.filter((t) => t.id !== id);

      const newActive =
        state.activeTabId === id
          ? newTabs.length > 0
            ? newTabs[Math.max(0, index - 1)].id
            : null
          : state.activeTabId;

      return {
        tabs: newTabs,
        activeTabId: newActive,
      };
    });
  },
  setActiveTab: (id: string) => {
    set({ activeTabId: id });
  },
  updateTab: (id: string, data: Partial<RequestTab>) => {
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === id ? { ...t, ...data, unsavedChanges: true } : t,
      ),
    }));
  },

  markUnsaved: (id: string, value: boolean) => {
    set((state) => ({
        tabs: state.tabs.map((t)=> t.id === id ? {...t, unsavedChanges: value} : t)
    }))
  },
  openRequestTab: (request: any) => {
    set((state)=> {
        const existingTab = state.tabs.find((t)=> t.requestId === request.id);
        if(existingTab){
            return {activeTabId: existingTab.id};
        }
        const newTab: RequestTab = {
            id: nanoid(),
            title: request.name || "Untitled",
            method: request.method,
            url: request.url,
            body: request.body,
            headers: request.headers,
            parameters: request.parameters,
            unsavedChanges: false,
            requestId: request.id,
            collectionId: request.collectionId,
            workspaceId: request.workspaceId,
            // setResponseViewerData: () => {},
        };
        return{
            tabs: [...state.tabs, newTab],
            activeTabId: newTab.id,
        }
    })
  },
  updateTabFromSavedRequest: (tabId: string, savedRequest: SavedRequest) => {
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === tabId
          ? {
              ...t,
              id: savedRequest.id,
              title: savedRequest.name,
              method: savedRequest.method,
              url: savedRequest.url,
              body: savedRequest.body,
              headers: savedRequest.headers,
              parameters: savedRequest.parameters || "",
              unsavedChanges: false,
            }
          : t,
      ),
      activeTabId: savedRequest.id,
    }));
  },
}));
