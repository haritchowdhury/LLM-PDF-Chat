import { SignOut } from "@/components/sign-out";
import { auth } from "@/lib/auth";
//import { redirect } from "next/navigation";
//import { ConnectWallet } from "@/components/wallet/connect";
import Link from "next/link";
//import { buttonVariants } from "@/components/ui/button";
import { CircleUserRound, Landmark } from "lucide-react";
//import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";
import Image from "next/image";

const Header = async () => {
  const session = await auth();
  //if (!session) redirect("/sign-in"); - what a laugh!

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white text-white shadow-md h-16 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-2 flex justify-between items-center h-full">
        {/* Logo on the left */}
        <Link
          href={`/`}
          className={buttonVariants({
            variant: "outline",
            //size: "lg",
            className:
              "bg-gradient-to-b from-indigo-200 border-gray-300 text-gray-800 hover:bg-gray-800 my-2",
          })}
        >
          <div className="text-gray-800 text-lg ">aiversety</div>
        </Link>

        {/* Navigation on the right */}
        <nav className="flex items-center gap-4 h-full">
          {session ? (
            <>
              <Link
                href="/"
                className={buttonVariants({
                  variant: "outline",
                  // size: "lg",
                  className:
                    "bg-gradient-to-b from-indigo-200 border-gray-300 text-gray-800 hover:bg-gray-800 my-2",
                })}
              >
                Browse
                <Landmark />
              </Link>
              <Link
                href={`/profile/${session?.user.id}`}
                className={buttonVariants({
                  variant: "outline",
                  //size: "lg",
                  className:
                    "bg-gradient-to-b from-indigo-200 border-gray-300 text-gray-800 hover:bg-gray-800 my-2",
                })}
              >
                Dashboard
                <CircleUserRound />
              </Link>
              <div className="my-2">
                <SignOut />
              </div>
            </>
          ) : (
            <div className="flex justify-center justify-between my-2">
              <Link
                href={`/sign-in`}
                className={buttonVariants({
                  variant: "outline",
                  //size: "lg",
                  className:
                    "bg-gradient-to-b from-indigo-200 border-gray-300 text-gray-800 hover:bg-gray-800 my-2",
                })}
              >
                Sign in
                <CircleUserRound />
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export { Header };
