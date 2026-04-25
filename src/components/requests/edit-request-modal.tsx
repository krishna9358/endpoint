"use client";

import Modal from "@/components/ui/modal";
import { useSaveRequest } from "@/hooks/requests/request";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { REST_METHOD } from "@prisma/client";
import { Request } from "@/actions/requests/index";

const EditRequestModal = ({
  isModalOpen,
  setIsModalOpen,
  requestId,
  initialData,
}: {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  requestId: string;
  initialData: Request | null;
}) => {
  const [name, setName] = useState("");
  const { mutateAsync, isPending } = useSaveRequest(requestId);

  useEffect(() => {
    if (initialData && isModalOpen) {
      setName(initialData.name);
    }
  }, [initialData, isModalOpen]);

  const handleSubmit = async () => {
    if (!name.trim() || !initialData || !requestId) return;
    try {
      await mutateAsync({
        ...initialData,
        name: name.trim(),
      });
      toast.success("Request updated successfully");
      setIsModalOpen(false);
    } catch (err) {
      toast.error("Failed to update request");
      console.error("Failed to update request:", err);
    }
  };

  return (
    <Modal
      title="Edit Request"
      description="Rename your request"
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      onSubmit={handleSubmit}
      submitText={isPending ? "Saving..." : "Save Changes"}
      submitVariant="default"
    >
      <div className="space-y-4">
        <label className="block text-sm font-medium mb-2 text-zinc-200">
          Request name
        </label>
        <input
          className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="Request name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>
    </Modal>
  );
};

export default EditRequestModal;
