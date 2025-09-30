// 
//  Actions for the workspace like create default workspace for user and get workspaces 
// 
"use server ";
 import db from "@/lib/db";
 import { currentUser } from "@/modules/authentication/actions";
 import { MEMBER_ROLE } from "@prisma/client";

//  Initializing the workspaces 
 export const initializeWorkspace = async () => {
    const user = await currentUser();
    if (!user) {
        return{
            success:false,
            error: "unauthorized, user not found"
        }
    } 
    try{
        const workspace = await db.workspace.upsert({
            where : {
                name_ownerId : {
                    ownerId: user.id,
                    name : "Personal Workspace"
                }
            },
            update:{},
            create : {
                name : "Personal Workspace",
                description : "Default workspace for user",
                ownerId : user.id,
                members: {
                    create:{
                        userId : user.id,
                        role: MEMBER_ROLE.ADMIN
                    }
                }
            },
            include:{
                members:true
            }
        })
        return {
            success :true,
            workspace
        }
    }catch(error){
        return {
            success : false,
            error : "failed to initialize workspace"
        }
    }

 }


 // Getting all the workspaces
 export const getWorkspaces = async () => {
     const user = await currentUser();
     if (!user){
        return {
            success : false,
            error : "unauthorized, user not found"
        }
     }
     const workspaces = db.workspace.findMany({
        where:{
            OR:[
                {ownerId:user.id},
                {members:{some:{userId:user.id}}}
            ]
        },
        orderBy:{
            createdAt: "asc"
        }

     });
     return workspaces;
 }

//  CREATE WORKSPACE FUNCTIONS
export const createWorkspaces = async (name: string) =>{
    const user = await currentUser();
    if (!user){
        return {
            success : false,
            error : "unauthorized, user not found"
        }
    }

    const workspace = db.workspace.create({
        data:{
            name: name,
            ownerId: user.id,
            members: {
                create:{
                    userId:user.id,
                    role: MEMBER_ROLE.ADMIN
                }
            }

        }
    })
    return workspace;
}


// get workspace by id
export const getWorkspaceById = async (id:string) => {
    const workspace = await db.workspace.findUnique({
        where: {id},
        include: {
            members: true,
        }
    })
    return workspace;
}