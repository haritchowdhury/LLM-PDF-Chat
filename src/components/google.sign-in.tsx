import { FcGoogle } from "react-icons/fc";
import { handleGoogleSignIn } from "@/app/actions/auth";
import { AuthSubmitButton } from "@/components/auth-submit-button";

const GoogleSignIn = ({ callbackUrl = "/" }: { callbackUrl?: string }) => {
  return (
    <form action={handleGoogleSignIn.bind(null, callbackUrl)}>
      <AuthSubmitButton pendingLabel="Continuing with Google...">
        <FcGoogle className="w-4 h-4 mr-2" />
        Continue with Google
      </AuthSubmitButton>
    </form>
  );
};

export { GoogleSignIn };
