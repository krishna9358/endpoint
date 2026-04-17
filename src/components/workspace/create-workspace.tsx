"use client";

import { useState } from "react";
import Modal from "../ui/modal";
import { Input } from "../ui/input";
import { useCreateWorkspace } from "@/hooks/workspace/workspace";
import { toast } from "sonner";


const CreateWorkspace = ({ isModalOpen, setIsModalOpen }: { isModalOpen: boolean, setIsModalOpen: (open: boolean) => void }) => {
  const [name, setName] = useState("");
  const {mutateAsync : createWorkspaces, isPending} = useCreateWorkspace();
  
  const handleSubmit = async () => {
    if(!name.trim()) return;
    try{
        await createWorkspaces(name);
        toast.success("Workspace successfully created!")
        setIsModalOpen(false);
        setName("");
    }catch(e){
        toast.error("Failed to create workspace")
    }
    
  } 
  return (
    <Modal 
      title="Create Workspace" 
      description="Add a new workspace to organize your projects" 
      isOpen={isModalOpen} 
      onClose={() => setIsModalOpen(false)}
      onSubmit={handleSubmit}
      submitText = {isPending ? "Creating..." : "Create Workspace"}
      submitVariant="default">
        <div className="space-y-4">
            <Input
                placeholder="Workspace name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border rounded-sm"
            />
        </div>
    </Modal>
  )

    
}

export default CreateWorkspace;