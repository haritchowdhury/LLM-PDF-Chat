import { auth } from "@/lib/auth";
import { signIn } from "@/lib/auth";
import { GithubSignIn } from "@/components/github-sign-in";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { executeAction } from "@/lib/executeAction";
import Link from "next/link";
import { redirect } from "next/navigation";
import ErrorToast from "@/components/ErrorToast";

const Page = async () => {
  const session = await auth();
  if (session) redirect("/");
  return (
    <main className="flex relative items-center justify-center min-h-screen bg-black">
      <div className="w-full max-w-sm mx-auto space-y-6">
        <ErrorToast />
        <GithubSignIn />
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with email
            </span>
          </div>
        </div>

        {/* Email/Password Sign In */}
        <form
          className="space-y-4"
          action={async (formData) => {
            "use server";
            await executeAction({
              actionFn: async () => {
                try {
                  await signIn("credentials", formData);
                } catch {
                  redirect("/sign-in?error=1");
                }
              },
            });
          }}
        >
          <Input
            name="email"
            placeholder="Email"
            type="email"
            required
            autoComplete="email"
          />
          <Input
            name="password"
            placeholder="Password"
            type="password"
            required
            autoComplete="current-password"
          />
          <Button className="w-full" type="submit">
            Sign In
          </Button>
        </form>

        <div className="text-center">
          <Button asChild variant="link">
            <Link className="text-white" href="/sign-up">
              Don&apos;t have an account? Sign up
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
};

export default Page;
