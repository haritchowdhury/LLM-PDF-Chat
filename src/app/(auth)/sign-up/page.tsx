import { signUp } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { GithubSignIn } from "@/components/github-sign-in";
import { Card /*CardContent, CardTitle*/ } from "@/components/ui/card";
import ErrorToast from "@/components/ErrorToast";

const Page = async () => {
  redirect("/sign-in");
  const session = await auth();
  if (session) redirect("/");

  return (
    <main className="flex relative items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-green-50 text-white">
      {/*  <Card
        className="flex flex-col gap-4 text-white bg-gradient-to-b from-indigo-900 to-gray-900 text-whit border-none p-12 
                      h-[90vh] overflow-y-auto w-full max-w-md sm:max-w-4xl lg:max-w-4xl mt-4 sm:mt-8"
      > */}
      <div className="w-full max-w-sm mx-auto space-y-6">
        {" "}
        <h1 className="text-black text-2xl font-bold text-center mb-6">
          Create Account
        </h1>
        <ErrorToast />
        <div className="text-black">
          <GithubSignIn />
        </div>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-gradient-to-br from-blue-50 to-green-50 rounded px-2 text-muted-foreground mt-2">
              Sign up with email
            </span>
          </div>
        </div>
        <form
          className="space-y-4 text-black"
          action={async (formData) => {
            "use server";
            const res = await signUp(formData);
            if (res.success) {
              redirect("/sign-in");
            }
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
            autoComplete="new-password"
          />
          <Button className="w-full" type="submit">
            Sign Up
          </Button>
        </form>
        <div className="text-center">
          <Button asChild variant="link">
            <Link className="text-black" href="/sign-in">
              Already have an account? Sign in
            </Link>
          </Button>
        </div>
      </div>
      {/* </Card> */}
    </main>
  );
};

export default Page;
