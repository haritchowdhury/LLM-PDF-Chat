import { auth } from "@/lib/auth";
import { GithubSignIn } from "@/components/github-sign-in";
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
          <GoogleSignIn />
        </div>
      </div>
    </main>
  );
};

export default Page;
