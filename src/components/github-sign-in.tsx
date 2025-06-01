import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Github } from "@/components/ui/github";

const GithubSignIn = ({ callbackUrl = "/" }: { callbackUrl?: string }) => {
  console.log("callback at github", callbackUrl);
  return (
    <form
      action={async () => {
        "use server";
        await signIn("github", { callbackUrl, redirect: true });
      }}
    >
      <Button className="w-full" variant="outline">
        <Github />
        Continue with GitHub
      </Button>
    </form>
  );
};

export { GithubSignIn };
