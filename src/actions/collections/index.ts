"use server";
import db from "@/lib/db";

// Creating a collection
export const createCollection = async (name: string, workspaceId: string) => {
  // Fetching the workspace by id
  const workspace = await db.workspace.findUnique({
    where: {
      id: workspaceId,
    },
  });
  if (!workspace) return;

  const collection = await db.collection.create({
    data: {
      name,
      workspace: {
        connect: {
          id: workspaceId,
        },
      },
    },
  });
};

// getting all the collections

export const getCollections = async (workspaceId: string) => {
  if (!workspaceId) return [];
  try {
    const workspace = await db.workspace.findUnique({
      where: {
        id: workspaceId,
      },
    });
    if (!workspace) return;
    const collections = await db.collection.findMany({
      where: {
        workspaceId,
      },
    });
    return collections;
  } catch (error) {
    console.log(error);
    return [];
  }
};

// Deleting a collection
export const deleteCollection = async (collectionId: string) => {
  try {
    const collection = await db.collection.findUnique({
      where: {
        id: collectionId,
      },
    });
    if (!collection) return;
    const deletedCollection = await db.collection.delete({
      where: {
        id: collectionId,
      },
    });
    return deletedCollection;
  } catch (error) {
    console.log(error);
    return null;
  }
};

// Updating a collection
export const updateCollection = async (collectionId: string, name: string) => {
  try {
    const collection = await db.collection.findUnique({
      where: {
        id: collectionId,
      },
    });
    if (!collection) return;
    const updatedCollection = await db.collection.update({
      where: {
        id: collectionId,
      },
      data: {
        name,
      },
    });
    return updatedCollection;
  } catch (error) {
    console.log(error);
    return null;
  }
};
