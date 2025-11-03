import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";
import { handleGoogleSignIn } from "@/app/actions/auth";

const GoogleSignIn = ({ callbackUrl = "/" }: { callbackUrl?: string }) => {
  console.log("callback at google", callbackUrl);
  return (
    <form action={handleGoogleSignIn.bind(null, callbackUrl)}>
      <Button className="w-full" variant="outline">
        <FcGoogle className="w-4 h-4 mr-2" />
        Continue with Google
      </Button>
    </form>
  );
};

export { GoogleSignIn };
