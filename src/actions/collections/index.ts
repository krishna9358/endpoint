"use server";
import db from "@/lib/db";
import { Prisma } from "@prisma/client";
import axios, { AxiosRequestConfig } from "axios";

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


type SendRequestSuccess = {
  status: number;
  statusText: string;
  headers: Record<string, unknown>;
  data: unknown;
  durationMs: number;
  size: number;
};

type SendRequestFailure = {
  error: string;
  durationMs: number;
  size: number;
};

export type SendRequestResult = SendRequestSuccess | SendRequestFailure;

function toResponseString(data: unknown): string {
  if (data === undefined || data === null) return "";
  return typeof data === "string" ? data : JSON.stringify(data);
}

export async function sendRequest(req: {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
  parameters?: Record<string, string>;
}): Promise<SendRequestResult> {
  const config: AxiosRequestConfig = {
    method: req.method,
    url: req.url,
    headers: req.headers,
    data: req.body,
    params: req.parameters,
    validateStatus: (status) => status >= 200 && status < 300,
  };
  const start = performance.now();
  try {
    const res = await axios(config);
    const end = performance.now();
    const duration = end - start;
    const contentLength = res.headers["content-length"];
    const size =
      typeof contentLength === "string"
        ? parseInt(contentLength, 10) ||
          new TextEncoder().encode(JSON.stringify(res.data)).length
        : typeof contentLength === "number"
          ? contentLength
          : new TextEncoder().encode(JSON.stringify(res.data)).length;
    return {
      status: res.status,
      statusText: res.statusText,
      headers: res.headers as Record<string, unknown>,
      data: res.data,
      durationMs: duration,
      size,
    };
  } catch (error: unknown) {
    const end = performance.now();
    const message = error instanceof Error ? error.message : "Request failed";
    return {
      error: message,
      durationMs: Math.round(end - start),
      size: 0,
    };
  }
}

export async function run(requestId: string) {
  try {
    const request = await db.request.findUnique({
      where: { id: requestId },
    });

    if (!request) throw new Error("Request ID not found");

    const requestConfig = {
      method: request.method,
      url: request.url,
      headers:
        (request.headers as unknown as Record<string, string>) || undefined,
      body: request.body || undefined,
      parameters:
        (request.parameters as unknown as Record<string, string>) || undefined,
    };

    const response = await sendRequest(requestConfig);
    const failed = "error" in response;

    const runData = {
      status: failed ? 0 : response.status,
      statusText: failed ? response.error : response.statusText,
      headers: failed
        ? Prisma.DbNull
        : (response.headers as Prisma.InputJsonValue),
      body: failed
        ? ({ error: response.error } as Prisma.InputJsonValue)
        : response.data == null
          ? Prisma.DbNull
          : (response.data as Prisma.InputJsonValue),
      durationMs: Math.round(response.durationMs),
    };

    const requestRun = await db.requestRun.upsert({
      where: { requestId },
      create: { requestId, ...runData },
      update: runData,
    });

    if (!failed && response.data != null) {
      await db.request.update({
        where: { id: requestId },
        data: { response: toResponseString(response.data) },
      });
    }

    return {
      success: !failed,
      requestRun,
      response,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "failed";
    try {
      const failedRun = await db.requestRun.upsert({
        where: { requestId },
        create: {
          requestId,
          status: 0,
          statusText: message,
          headers: Prisma.DbNull,
          body: { error: message },
          durationMs: 0,
        },
        update: {
          status: 0,
          statusText: message,
          headers: Prisma.DbNull,
          body: { error: message },
          durationMs: 0,
        },
      });
      return {
        success: false,
        requestRun: failedRun,
        error: message,
      };
    } catch (dberror) {
      console.log(error);
      const dbMessage =
        dberror instanceof Error ? dberror.message : String(dberror);
      return {
        success: false,
        error: `Request failed: ${message}. DB save failed: ${dbMessage}`,
      };
    }
  }
}


// ? TODO: Add a function to run a request without saving it to db. 