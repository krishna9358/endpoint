"use server";

import db from "@/lib/db";
import { request } from "http";

export type Request = {
    name : string,
    url : string,
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
    parameters?: string,
    headers?: string,
    body?: string,
    response?: string
}

export const addRequestToCollection = async (collectionId : string, value: Request) => {
    try {
        const request = await db.request.create({
            data: {
                name : value.name,
                url : value.url,
                method : value.method,
                collectionId : collectionId,
                parameters : value.parameters,
                headers : value.headers,
                body : value.body,
                response : value.response,
            }
        })

        return request;
    } catch (error) {
        console.log(error);
    }
}


export const saveRequest = async (id:string, value : Request) => {
    try {
        const response = await db.request.update({
            where: {
        id: id,
            },
            data: {
                name : value.name,
                url : value.url,
                method : value.method,
                parameters : value.parameters,
                headers : value.headers,
                body : value.body,
                response : value.response,
            }
        })

        return response;
    } catch (error) {
        console.log(error);
    }
}

export const deleteRequest = async (requestId : string) => {
    try {
        const request = await db.request.delete({
            where: {
                id: requestId,
            },
        })

        return request;
    } catch (error) {
        console.log(error);
    }
}


export const getRequests = async (collectionId : string) => {
    try {
        const requests = await db.request.findMany({
            where: {
                collectionId : collectionId,
            },
        })

        return requests;
    } catch (error) {
        console.log(error);
    }
}


export const getRequestById = async (requestId : string) => {
    try {
        const request = await db.request.findUnique({
            where: {
                id: requestId,
            },
        })

        return request;
    } catch (error) {
        console.log(error);
    }
}


