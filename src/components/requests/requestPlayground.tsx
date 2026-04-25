"use client";
import { useSaveRequest } from '@/hooks/requests/request';
import { useRequestPlaygroundStore } from '@/store/request/useRequestStore';
import  { useState } from 'react'
import WelcomeRequest from './welcome-request';
import TabBar from './tab-bar';

const RequestPlayground = () => {
    const { tabs, activeTabId , addTab} = useRequestPlaygroundStore();
    const activeTab = tabs.find((t)=> t.id === activeTabId);

    const {mutateAsync, isPending} = useSaveRequest(activeTab?.requestId!);
    const [showSaveModel, setShowSaveModel] = useState<boolean>(false);

    // if(!activeTab){
    //     return (
    //         <div className="w-full h-full flex items-center justify-center">
    //             <WelcomeRequest />
    //         </div>
    //     )
    // }
  return (
   <div className="flex flex-col h-full">
      <TabBar />
      <div className="flex-1 overflow-auto">
        {/* <RequestEditor /> */}
      </div>

    </div>
  )
}

export default RequestPlayground