import { Chat } from "@/components/chat";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

const Page = async () => {
  const session = await auth();
  if (!session) redirect("/sign-in");
  const email = String(session.user?.email);
  return (
    <>
      <main className="flex relative items-center justify-center min-h-screen bg-black">
        <Chat email={email} />
      </main>
    </>
  );
};

export default Page;
