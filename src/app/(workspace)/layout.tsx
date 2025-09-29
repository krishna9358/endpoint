import React from "react";

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <main className="max-h-[calc(100vh-4rem)] h-[calc(100vh-4rem)] flex flex-1 overflow-hidden">
        <div className="flex h-full w-full">
          <div className="w-12 border-zinc-800 bg-zinc-900">
            table left panel
          </div>
          <div className="flex-1 bg-zinc-900">{children}</div>
        </div>
      </main>
    </>
  );
};

export default RootLayout;
