import { auth } from "@/lib/auth";
import { signIn } from "@/lib/auth";
import { GithubSignIn } from "@/components/github-sign-in";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { executeAction } from "@/lib/executeAction";
import Link from "next/link";
import { redirect } from "next/navigation";
import ErrorToast from "@/components/ErrorToast";
import Image from "next/image";
import { Card /*CardContent, CardTitle*/ } from "@/components/ui/card";

const Page = async () => {
  const session = await auth();
  if (session) redirect("/");
  return (
    <main className="flex relative items-center justify-center min-h-screen bg-gradient-to-b from-indigo-900 to-gray-900 text-white">
      <Card
        className="flex flex-col gap-4 text-white bg-gradient-to-b from-indigo-900 to-gray-900 text-whit border-none p-12 
                      h-[90vh] overflow-y-auto w-full max-w-md sm:max-w-4xl lg:max-w-4xl mt-4 sm:mt-8"
      >
        <div className="w-full max-w-sm mx-auto space-y-6">
          <h1 className="text-white text-2xl font-bold text-center mb-6">
            Log In to your account
          </h1>
          <ErrorToast />
          <div className="text-black">
            <GithubSignIn />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-background px-2 text-muted-foreground  text-black mt-2">
                  Or continue with email
                </span>
              </div>
            </div>
            <br />
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
          </div>
          <div className="text-center">
            <Button asChild variant="link">
              <Link className="text-white" href="/sign-up">
                Don&apos;t have an account? Sign up
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    </main>
  );
};

export default Page;
