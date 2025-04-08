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
          <div className="flex justify-center justify-between">
            <Link
              href="/sign-in"
              className="
                      relative inline-flex items-center justify-center gap-2
                      px-6 py-3 overflow-hidden
                      font-medium text-white rounded-lg
                      bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900
                      hover:from-gray-800 hover:via-gray-900 hover:to-black
                      shadow-lg transition-all duration-300 ease-out
                      hover:shadow-gray-700/40
                      group
                  "
            >
              {/* Shine effect */}
              <span
                className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r 
                          from-transparent via-white/20 to-transparent
                          transition-all duration-1000 ease-in-out
                          group-hover:left-[100%]"
                style={{ transform: "skewX(-25deg)" }}
              ></span>

              {/* Button text and icon */}
              <span className="relative flex items-center gap-2">
                Sign in
                <CircleUserRound className="w-5 h-5" />
              </span>
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
};

export { Header };
