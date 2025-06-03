import { auth } from "@/lib/auth";
import { signIn } from "@/lib/auth";
import { GithubSignIn } from "@/components/github-sign-in";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { executeAction } from "@/lib/executeAction";
import Link from "next/link";
import { redirect } from "next/navigation";
import ErrorToast from "@/components/ErrorToast";
import { GoogleSignIn } from "@/components/google.sign-in";

const Page = async ({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) => {
  const session = await auth();
  if (session) redirect("/");
  const params = await searchParams;
  const callbackUrl = params.callbackUrl || "/";
  return (
    <main className="flex relative items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-green-50 text-white">
      <div className="w-full max-w-sm mx-auto space-y-6">
        <h1 className="text-black text-2xl font-bold text-center mb-6">
          Log In to your account
        </h1>
        <ErrorToast />
        <div className="text-black">
          <GithubSignIn />
        </div>
        <div className="text-black">
          <GoogleSignIn />
        </div>
        {/*   <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-gradient-to-br from-blue-50 to-green-50 px-2 text-muted-foreground  text-black mt-2">
              Or continue with email
            </span>
          </div>
        </div>

        <form
          className="space-y-4 text-gray-900"
          action={async (formData) => {
            "use server";
            await executeAction({
              actionFn: async () => {
                try {
                  formData.append("callbackUrl", callbackUrl);

                  await signIn("credentials", formData);
                } catch {
                  redirect(
                    `/sign-in?error=1&callbackUrl=${encodeURIComponent(callbackUrl)}`
                  );
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
            <Link className="text-black" href="/sign-up">
              Don&apos;t have an account? Sign up
            </Link>
          </Button>
        </div> */}
      </div>
    </main>
  );
};

export default Page;
