// components/Header.tsx (SERVER COMPONENT - UPDATED)
import { SignOut } from "@/components/sign-out";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { CircleUserRound, Landmark } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import Image from "next/image";
import { HeaderNavigation } from "./HeaderNavigation";

const Header = async () => {
  const session = await auth();

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white text-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 flex justify-between items-center min-h-16">
        {/* Logo on the left - Server rendered (static) */}
        <Link href={`/`}>
          <div className="flex items-center gap-2 text-gray-800 text-sm sm:text-lg font-bold">
            <Image
              src="/cropped_circle_image.png"
              alt="Aiversety Logo"
              width={32}
              height={32}
              className="w-6 h-6 sm:w-8 sm:h-8"
            />
            Aiversety
          </div>
        </Link>

        {/* Navigation on the right - Client rendered (dynamic) */}
        <HeaderNavigation
          isAuthenticated={!!session}
          userId={session?.user?.id}
        />
      </div>
    </header>
  );
};

export { Header };
