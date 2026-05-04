// Getting current user data

"use server";
import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { headers } from "next/headers";
import React from "react";

export const currentUser = async () => {
  try {
    if (process.env.NODE_ENV === "development") {
      let devUser = await db.user.findFirst({
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      if (!devUser) {
        devUser = await db.user.create({
          data: {
            id: "dev-user-id",
            name: "Dev User",
            email: "dev@example.com",
            emailVerified: true,
          },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            createdAt: true,
            updatedAt: true,
          },
        });
      }
      return devUser;
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return null;
    }
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return user;
  } catch (error) {
    console.error("Error while fetching current user ==> ", error);
    return null;
  }
};
