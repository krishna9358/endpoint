"use client";
import { useSaveRequest } from '@/hooks/requests/request';
import { useRequestPlaygroundStore } from '@/store/request/useRequestStore';
import { useState } from 'react'
import WelcomeRequest from './welcome-request';
import TabBar from './tab-bar';
import { useHotkeys } from 'react-hotkeys-hook';
import { toast } from 'sonner';
import RequestEditor from './request-editor';
import { REST_METHOD } from '@prisma/client';
import SaveRequestToCollectionModal from './add-request-modal';

const RequestPlayground = () => {
  const { tabs, activeTabId, addTab } = useRequestPlaygroundStore();
  const activeTab = tabs.find((t) => t.id === activeTabId);

  const { mutateAsync, isPending } = useSaveRequest(activeTab?.requestId!);
  const [showSaveModel, setShowSaveModel] = useState<boolean>(false);

const getCurrentRequestData = ()=>{
  if(!activeTab) {
    return {
      name : "Untitled Request",
      method : REST_METHOD.GET as REST_METHOD,
      url : "https://krishna-mohan.vercel.app"
    }
  }
  return {
    name: activeTab.title,
    method: activeTab.method as REST_METHOD,
    url: activeTab.url,
  }
}


//  Save Request Tab shortcut
  useHotkeys("mod+s", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const data = getCurrentRequestData();

    if(!activeTab){
      toast.error("No active request to save");
      return; 
    } 
    if(activeTab.collectionId){
      try{
          await mutateAsync({
            url: activeTab.url || "https://krishna-mohan.vercel.app",
            method: activeTab.method as REST_METHOD,
            name: activeTab.title || "Untitled Request",
            body: activeTab.body,
            headers: activeTab.headers,
            parameters: activeTab.parameters,
          });
          toast.success("Request Saved successfully");
      }catch(error){
        toast.error("Failed to save request");
        console.log(error);
      }
    }
    else {
      setShowSaveModel(true);
    }

  }, {
    preventDefault: true,
    enableOnFormTags: true
  }, [activeTab, mutateAsync])


  // New Tab Shortcut
  useHotkeys("mod+shift+g", (e) => {
    if (e.repeat) return;
    
    e.preventDefault();
    e.stopPropagation();
    addTab();
    toast.success("Tab Added successfully")

  }, {
    preventDefault: true,
    enableOnFormTags: true
  }, [])

  if (!activeTab) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <WelcomeRequest />
      </div>
    )
  }
  return (
    <div className="flex flex-col h-full">
      <TabBar />
      <div className="flex-1 overflow-auto">
        <RequestEditor />
      </div>

      {/* Save Request Modal */}
      <SaveRequestToCollectionModal
          isModalOpen={showSaveModel}
          setIsModalOpen={setShowSaveModel}
          requestData={getCurrentRequestData()}
          initialName={getCurrentRequestData().name}
      />

    </div>
  )
}

export default RequestPlayground