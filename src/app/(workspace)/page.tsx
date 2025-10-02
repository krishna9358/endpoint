import { Button } from "@/components/ui/button";
import Image from "next/image";
import UserButton from "@/components/authentication/user-button";
import { currentUser } from "@/actions/authentication";

export default async function Home() {
  const user = await currentUser();
  return <>{/* <UserButton user={user} /> */}</>;
}
