import { currentUser } from "@/actions/authentication";
import Header from "@/components/layout/header";
import { initializeWorkspace } from "@/actions/workspace";
import { redirect } from "next/navigation";
import React from "react";

export const dynamic = "force-dynamic";

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  const user = await currentUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const workspace = await initializeWorkspace();
  console.log(workspace);
  return (
    <>
      {/* Header */}
      {/* @ts-ignore */}
      <Header user={user} />
      {/* Main Content */}
      <main className="max-h-[calc(100vh-4rem)] h-[calc(100vh-4rem)] flex flex-1 overflow-hidden">
        <div className="flex h-full w-full">
          {/* <div className="w-12 border-zinc-800 bg-zinc-900">
            table left panel
          </div> */}
          <div className="flex-1 bg-zinc-900">{children}</div>
        </div>
      </main>
    </>
  );
};

export default RootLayout;
