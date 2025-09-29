import { Button } from "@/components/ui/button";
import Image from "next/image";
import UserButton from "@/modules/authentication/components/user-button";
import { currentUser } from "@/modules/authentication/actions";

export default async function Home() {
  const user = await currentUser();
  return (
    <>
      {/* <UserButton user={user} /> */}
    </>
  );
}
