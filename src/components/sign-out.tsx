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
        className="flex gap-2 items-center border border-blue-600  text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 hover:text-white transition-colors"
        onClick={handleSignOut}
      >
        Sign Out
      </Button>
    </div>
  );
};

export { SignOut };
