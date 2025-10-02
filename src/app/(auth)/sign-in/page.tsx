"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signIn } from "@/lib/auth-client";
import { Chrome, Github, Unplug } from "lucide-react";
import Link from "next/link";
import React from "react";

const LoginPage = () => {
  return (
    <section
      className="flex min-h-screen bg-no-repeat bg-center bg-cover dark:bg-transparent px-4 py-16 md:py-32"
      style={{ backgroundImage: `url("/bg2.jpg")` }}
    >
      <div className=""></div>
      <div className="bg-card m-auto h-fit w-full max-w-sm rounded-[calc(var(--radius)+.125rem)] border-2  border-gray-400 p-0.5 shadow-lg  dark:[--color-muted:var(--color-zinc-900)] ">
        <div className="p-8 pb-6">
          <div>
            <div className="flex items-center justify-center">
              <Unplug size={28} className="text-indigo-400 mr-2" />
            </div>
            <div className=" items-center text-center mb-1 mt-2 gap-4">
              <h1 className="text-xl font-semibold">Sign in to Endpoint</h1>
            </div>
            <p className="text-sm text-center">
              Welcome back! Sign in to continue
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3">
            <Button
              variant="outline"
              className="w-full hover:cursor-pointer hover:opacity-80"
              onClick={() =>
                signIn.social({
                  provider: "github",
                  callbackURL: "/",
                })
              }
            >
              <Github className="mr-2 h-4 w-4" />
              Sign in with GitHub
            </Button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3">
            <Button
              variant="outline"
              className="w-full hover:cursor-pointer hover:opacity-80"
              onClick={() =>
                signIn.social({
                  provider: "google",
                  callbackURL: "/",
                })
              }
            >
              <Chrome className="mr-2 h-4 w-4" />
              Sign in with Google
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LoginPage;
