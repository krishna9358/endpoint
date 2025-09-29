export interface UserProps{
    id: string;
    email: string;
    name: string;
    image:string | null;
    createdAt: Date;
    updatedAt: Date;
}