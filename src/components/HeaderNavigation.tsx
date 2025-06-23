// components/HeaderNavigation.tsx (CLIENT COMPONENT)
"use client";
import { usePathname } from "next/navigation";
import { SignOut } from "@/components/sign-out";
import Link from "next/link";
import { CircleUserRound, Landmark } from "lucide-react";

type HeaderNavigationProps = {
  isAuthenticated: boolean;
  userId?: string;
};

export function HeaderNavigation({
  isAuthenticated,
  userId,
}: HeaderNavigationProps) {
  const pathname = usePathname(); // This updates on route changes!

  // Logic to determine if we should show the Classrooms button
  const shouldShowClassrooms = (() => {
    // Hide on root page
    if (pathname === "/") {
      return false;
    }

    // Hide on own profile page

    // Show on all other pages
    return true;
  })();

  const shouldShowMyPage = (() => {
    if (userId) {
      const profileMatch = pathname.match(/^\/profile\/(.+)$/);
      if (profileMatch && profileMatch[1] === userId) {
        return false;
      }
      return true;
    }
    return false;
  })();

  console.log(
    "HeaderNavigation - pathname:",
    pathname,
    "showClassrooms:",
    shouldShowClassrooms,
    "shouldShowMyPage",
    shouldShowMyPage
  );

  return (
    <nav className="flex items-center gap-1 sm:gap-4 h-full">
      {isAuthenticated ? (
        <>
          {/* Conditionally show Classrooms button based on current route */}
          {shouldShowClassrooms && (
            <Link
              href="/"
              className="flex gap-2 items-center bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              <span className="hidden md:inline">Classrooms</span>
              <Landmark className="h-4 w-4" />
            </Link>
          )}
          {shouldShowMyPage && (
            <Link
              href={`/profile/${userId}`}
              className="flex gap-2 items-center bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              <span className="hidden sm:inline">My Page</span>
              <CircleUserRound className="h-4 w-4" />
            </Link>
          )}

          <div className="flex items-center">
            <SignOut />
          </div>
        </>
      ) : (
        <div className="flex flex-row">
          <Link
            href={`/sign-in`}
            className="flex gap-2 items-center bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            <span className="hidden sm:inline">Sign in</span>
            <CircleUserRound className="h-4 w-4" />
          </Link>
        </div>
      )}
    </nav>
  );
}
