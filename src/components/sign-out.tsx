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
        className={buttonVariants({
          variant: "outline",
          // /size: "lg",
          className:
            "bg-gradient-to-b from-indigo-200  border-gray-300 text-gray-800 hover:bg-gray-800",
        })}
        onClick={handleSignOut}
      >
        Sign Out
      </Button>
    </div>
  );
};

export { SignOut };
