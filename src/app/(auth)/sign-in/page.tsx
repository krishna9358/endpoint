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
import { Chrome, Github } from "lucide-react";
import Link from "next/link";
import React from "react";

const LoginPage = () => {
  return (
    <section className="flex min-h-screen bg-zinc-50 dark:bg-transparent px-4 py-16 md:py-32">
      <div className="bg-card m-auto  w-full max-w-sm rounded-2xl border p-2 shadow-md  ">
        <div>
          <Link href={"/"}>
            <h1 className="text-2xl font-bold">Postman</h1>
          </Link>
          <h1 className="mb-1 mt-4 text-xl font-semibold">
            Sign in to PostMan
          </h1>
          <p className="text-sm">Welcome back! Sign in to continue</p>
        </div>
      </div>
    </section>
  );
};

export default LoginPage;
