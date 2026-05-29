
// this component is used when user click on the rename request on right side to rename the request
"use client";

import Modal from "@/components/ui/modal";
import { useSaveRequest } from "@/hooks/requests/request";
import { useSuggestRequestName } from "@/hooks/ai/ai-suggestion";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Request } from "@/actions/requests/index";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  const [name, setName] = useState(initialData?.name || "");
  const [suggestions, setSuggestions] = useState<
    Array<{ name: string; reasoning: string }>
  >([]);
  const { mutateAsync: saveRequest, isPending: isSaving } =
    useSaveRequest(requestId);
  const { mutateAsync: suggestName, isPending: isSuggesting } =
    useSuggestRequestName();

  useEffect(() => {
    if (initialData && isModalOpen) {
      setName(initialData.name);
      setSuggestions([]);
    }
  }, [initialData, isModalOpen]);

  const handleSubmit = async () => {
    if (!name.trim() || !initialData || !requestId) return;
    try {
      await saveRequest({
        ...initialData,
        name: name.trim(),
      });
      toast.success("Request updated successfully");
      setIsModalOpen(false);
      setSuggestions([]);
    } catch (err) {
      toast.error("Failed to update request");
      console.error("Failed to update request:", err);
    }
  };

  const handleSuggestName = async () => {
    if (!initialData) return;
    try {
      const result = await suggestName({
        workspaceName: "Default Workspace",
        method: initialData.method as
          | "GET"
          | "POST"
          | "PUT"
          | "PATCH"
          | "DELETE",
        url: initialData.url || "",
        description: `Request named "${initialData.name}"`,
      });

      if (result.suggestions?.length > 0) {
        setSuggestions(result.suggestions);
        setName(result.suggestions[0].name);
      }
    } catch {
      toast.error("Failed to generate name suggestions");
    }
  };

  return (
    <Modal
      title="Edit Request"
      description="Rename your request"
      isOpen={isModalOpen}
      onClose={() => {
        setIsModalOpen(false);
        setSuggestions([]);
      }}
      onSubmit={handleSubmit}
      submitText={isSaving ? "Saving..." : "Save Changes"}
      submitVariant="default"
    >
      <div className="flex flex-col gap-4">
        <label className="block text-sm font-medium text-zinc-200">
          Request name
        </label>
        <div className="flex flex-row items-center gap-2">
          <Input
            className="w-full p-2 border rounded bg-zinc-900 text-white"
            placeholder="Request name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <Button
            variant="outline"
            size="icon"
            type="button"
            onClick={handleSuggestName}
            disabled={isSuggesting || !initialData}
          >
            <Sparkles className="h-5 w-5 text-indigo-500" />
          </Button>
        </div>

        {suggestions.length > 0 && (
          <div className="flex flex-col gap-2">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="flex flex-row justify-between items-center p-2 border rounded bg-zinc-900 hover:bg-zinc-800 cursor-pointer"
                onClick={() => setName(suggestion.name)}
              >
                <span className="text-sm text-white">{suggestion.name}</span>
                <span className="text-xs text-gray-400">
                  {suggestion.reasoning}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default EditRequestModal;
