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


const WorkSpace = () => {


  return (
    <>
      <Hint label="Change Workspace">
        <Select

        >
          <SelectTrigger className="border border-indigo-400 bg-indigo-400/10 hover:bg-indigo-400/20 text-indigo-400 hover:text-indigo-300 flex flex-row items-center space-x-1">
            <User className="size-4 text-indigo-400" />
            <span className="text-sm text-indigo-400 font-semibold">
              <SelectValue placeholder="Select workspace" />
            </span>
          </SelectTrigger>
          <SelectContent>
            <Separator className="my-1" />
            <div className="p-2 flex flex-row justify-between items-center">
              <span className="text-sm font-semibold text-zinc-600">My Workspaces</span>
              <Button size="icon" variant="outline" >
                <Plus size={16} className="text-indigo-400" />
              </Button>
            </div>
          </SelectContent>
        </Select>
      </Hint>


    </>
  );
};

export default WorkSpace;