import { SignOut } from "@/components/sign-out";
import { auth } from "@/lib/auth";
//import { redirect } from "next/navigation";
import { ConnectWallet } from "@/components/wallet/connect";
import Link from "next/link";
//import { buttonVariants } from "@/components/ui/button";
import { CircleUserRound, Landmark } from "lucide-react";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";

const Header = async () => {
  const session = await auth();
  //if (!session) redirect("/sign-in"); - what a laugh!

  return (
    <header className="fixed top-0 left-0 w-full bg-black text-white z-50 h-16 border-b border-gray-800">
      <nav className="flex justify-end h-full max-w-7xl mx-auto px-4  gap-2 py-2 ">
        {session ? (
          <>
            <ConnectWallet />
            <Link href="/" className={buttonVariants()}>
              Home
              <Landmark />
            </Link>
            <Link
              href={`/profile/${session?.user.id}`}
              className={buttonVariants()}
            >
              Profile
              <CircleUserRound />
            </Link>
            <SignOut />
          </>
        ) : (
          <></>
        )}
      </nav>
    </header>
  );
};

export { Header };
