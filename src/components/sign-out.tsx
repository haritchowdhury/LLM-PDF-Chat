"use client";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import { buttonVariants } from "@/components/ui/button";

const SignOut = () => {
  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="flex justify-center">
      <Button
        className="flex gap-2 items-center bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        onClick={handleSignOut}
      >
        Sign Out
      </Button>
    </div>
  );
};

export { SignOut };
