import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";

const GoogleSignIn = ({ callbackUrl = "/" }: { callbackUrl?: string }) => {
  console.log("callback at google", callbackUrl);
  return (
    <form
      action={async () => {
        "use server";
        await signIn("google", { callbackUrl, redirect: true });
      }}
    >
      <Button className="w-full" variant="outline">
        <FcGoogle className="w-4 h-4 mr-2" />
        Continue with Google
      </Button>
    </form>
  );
};

export { GoogleSignIn };
