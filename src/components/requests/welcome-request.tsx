import { Unplug } from 'lucide-react'
import React from 'react'

const WelcomeRequest = () => {
  return (
    <div>
              <div className="flex space-y-4 flex-col h-full items-center justify-center">
        <div className="flex flex-col justify-center items-center h-40 w-40 border rounded-full bg-zinc-900">
          <Unplug size={80} className='text-indigo-400' />
        </div>
       

        <div className="bg-zinc-900 p-4 rounded-lg space-y-2">
          <div className="flex justify-between items-center gap-8">
            <kbd className="px-2 py-1 bg-zinc-800 text-indigo-400 text-sm rounded border">Ctrl+Shift+N</kbd>
            <span className="text-zinc-400 font-semibold">New Request</span>
          </div>
          <div className="flex justify-between items-center gap-8">
            <kbd className="px-2 py-1 bg-zinc-800 text-indigo-400 text-sm rounded border">Ctrl+S</kbd>
            <span className="text-zinc-400 font-semibold">Save Request</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WelcomeRequest