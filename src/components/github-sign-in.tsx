import { signIn } from "@/lib/auth";
import { Github } from "@/components/ui/github";
import { AuthSubmitButton } from "@/components/auth-submit-button";

const GithubSignIn = ({ callbackUrl = "/" }: { callbackUrl?: string }) => {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("github", { callbackUrl, redirect: true });
      }}
    >
      <AuthSubmitButton pendingLabel="Continuing with GitHub...">
        <Github />
        Continue with GitHub
      </AuthSubmitButton>
    </form>
  );
};

export { GithubSignIn };
