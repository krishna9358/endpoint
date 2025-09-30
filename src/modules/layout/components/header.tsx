"use client"
import { Unplug, Search } from 'lucide-react'
import React from 'react'
import SearchBar from './searchbar'
import UserButton from '@/modules/authentication/components/user-button'

// import InviteMember from './invite-member'
// import WorkSpace from './workspace'
import { UserProps,  } from '../types'
import InviteMember from './invite-members'
import Workspace from './workspace'


interface Props {
  user: UserProps
//   workspace: WorkspaceProps
}

const Header = ({ user }: Props) => {

  return (
    <header className='grid grid-cols-5 grid-rows-1 gap-2 overflow-x-auto overflow-hidden p-2 border'>
      <div className='col-span-2 flex items-center justify-between space-x-2   ml-4'>
        <div className='flex items-center hover:cursor-pointer hover:opacity-80'>
          <Unplug size={28} className='text-indigo-400 mr-2' />
          <h1 className='font-bold'>Endpoint</h1>
        </div>
      </div>

      <div className='col-span-1 flex items-center justify-between space-x-2'>
        <div className="border-animation relative p-[1px] rounded flex-1 self-stretch overflow-hidden flex items-center justify-center" aria-hidden="true">
          <SearchBar />
        </div>
      </div>

      <div className='col-span-2 flex  justify-end  mr-4 gap-2'>
        <div className='flex items-center space-x-2 '>
        <InviteMember props={{className: 'hover:opacity-80 hover:cursor-pointer'}} />

        <Workspace />
        <UserButton user={user} size='sm' />
        </div>
        
      </div>
    </header>
  )
}

export default Header