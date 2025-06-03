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
    <header className="fixed top-0 left-0 w-full z-50 bg-white text-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 flex justify-between items-center min-h-16">
        {/* Logo on the left */}
        <Link
          href={`/`}
          className={buttonVariants({
            variant: "outline",
            size: "sm", // Use smaller size on mobile
            className:
              "bg-gradient-to-b from-indigo-200 border-gray-300 text-gray-800 hover:bg-gray-800 shrink-0",
          })}
        >
          <div className="text-gray-800 text-sm sm:text-lg">aiversety</div>
        </Link>

        {/* Navigation on the right */}
        <nav className="flex items-center gap-1 sm:gap-4 h-full">
          {session ? (
            <>
              <Link
                href="/"
                className={buttonVariants({
                  variant: "outline",
                  size: "sm",
                  className:
                    "bg-gradient-to-b from-indigo-200 border-gray-300 text-gray-800 hover:bg-gray-800 hidden sm:flex",
                })}
              >
                <span className="hidden md:inline">Browse</span>
                <Landmark className="h-4 w-4" />
              </Link>
              <Link
                href={`/profile/${session?.user.id}`}
                className={buttonVariants({
                  variant: "outline",
                  size: "sm",
                  className:
                    "bg-gradient-to-b from-indigo-200 border-gray-300 text-gray-800 hover:bg-gray-800",
                })}
              >
                <span className="hidden sm:inline">Dashboard</span>
                <CircleUserRound className="h-4 w-4" />
              </Link>
              <div className="flex items-center">
                <SignOut />
              </div>
            </>
          ) : (
            <div className="flex items-center">
              <Link
                href={`/sign-in`}
                className={buttonVariants({
                  variant: "outline",
                  size: "sm",
                  className:
                    "bg-gradient-to-b from-indigo-200 border-gray-300 text-gray-800 hover:bg-gray-800",
                })}
              >
                <span className="hidden sm:inline">Sign in</span>
                <CircleUserRound className="h-4 w-4" />
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export { Header };
