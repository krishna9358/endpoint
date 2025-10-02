"use client";

import { Button } from "@/components/ui/button";
import { Hint } from "@/components/ui/hint";
import { Loader, Plus, User } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { useEffect, useState } from "react";
import { useWorkspaces } from "@/hooks/workspace/workspace";

const WorkSpace = () => {
  const { data: workspaces, isLoading, error } = useWorkspaces();
  const { selectedWorkspace, setSelectedWorkspace } = useWorkspaceStore();
  const [modalOpen, setModalOpen] = useState(false);
  useEffect(() => {
    if (workspaces && workspaces.length > 0 && !selectedWorkspace) {
      setSelectedWorkspace(workspaces[0]);
    }
  }, [workspaces, setSelectedWorkspace, selectedWorkspace]);

  if (isLoading) {
    return <Loader className="animate-spin size-4 text-indigo-400" />;
  }
  if (!workspaces || workspaces.length === 0) {
    return (
      <div className="text-indigo-400 font-semibold">No workspaces found</div>
    );
  }

  return (
    <>
      <Hint label="Change Workspace">
        <Select
          value={selectedWorkspace?.id}
          onValueChange={(id) => {
            const workspace = workspaces.find((w) => w.id === id);
            if (workspace) {
              setSelectedWorkspace(workspace);
            }
          }}
        >
          <SelectTrigger className="border border-indigo-400 bg-indigo-400/10 hover:bg-indigo-400/20 text-indigo-400 hover:text-indigo-300 flex flex-row items-center space-x-1">
            <User className="size-4 text-indigo-400" />
            <span className="text-sm text-indigo-400 font-semibold">
              <SelectValue placeholder="Select workspace" />
            </span>
          </SelectTrigger>
          <SelectContent>
            {workspaces.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                {w.name}
              </SelectItem>
            ))}
            <Separator className="my-1" />
            <SelectItem value="new">
              <Button
                variant="ghost"
                onClick={() => {
                  setModalOpen(true);
                }}
              >
                <Plus className="size-4" />
                <span className="text-sm text-indigo-400 font-semibold">
                  New workspace
                </span>
              </Button>
            </SelectItem>
          </SelectContent>
        </Select>
      </Hint>
    </>
  );
};

export default WorkSpace;
