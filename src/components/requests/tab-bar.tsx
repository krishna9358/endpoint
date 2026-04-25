"use client";
import { X } from "lucide-react";
import { useState } from "react";
import { useRequestPlaygroundStore } from "@/store/request/useRequestStore";


export default function TabBar() {
  const { tabs, activeTabId, setActiveTab, addTab, closeTab } =
    useRequestPlaygroundStore();
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [selectedTabId, setSelectedTabId] = useState<string | null>(null);

  const requestColorMap: Record<string, string> = {
    GET: "text-green-500",
    POST: "text-blue-500",
    PUT: "text-yellow-500",
    DELETE: "text-red-500",
  };

  const onDoubleClick = (tabId: string) => {
    setSelectedTabId(tabId);
    setRenameModalOpen(true);
  }

  return (
    <>
      <div className="flex items-center border-b border-zinc-800 bg-zinc-900">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onDoubleClick={() => onDoubleClick(tab.id)}
            onClick={() => setActiveTab(tab.id)}
            className={`group h-10 px-4 flex items-center justify-between min-w-[160px] max-w-[220px] border-r border-zinc-800 cursor-pointer border-t-2 transition-colors ${
              activeTabId === tab.id
                ? "bg-zinc-800 text-white border-t-indigo-500"
                : "bg-transparent text-zinc-400 hover:bg-zinc-800/50 hover:text-white border-t-transparent"
            }`}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <span
                className={`font-semibold text-xs ${
                  requestColorMap[tab.method] || "text-gray-500"
                }`}
              >
                {tab.method}
              </span>

              <div className="flex items-center gap-2 overflow-hidden">
                <p className="truncate font-semibold text-sm">
                  {tab.title}
                </p>
                {tab.unsavedChanges && (
                  <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                )}
              </div>
            </div>

            <div className="relative flex items-center justify-center w-6 h-6 ml-2 shrink-0 rounded hover:bg-zinc-700/50">
              <X
                className={`w-4 h-4 text-zinc-400 hover:text-red-400 transition-opacity duration-200 ${
                  activeTabId === tab.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
              />
            </div>
          </div>

        ))}
        <button
          onClick={addTab}
          className="px-3 py-2 text-zinc-400 hover:text-white"
        >
          +
        </button>
      </div>

    </>
  );
}
