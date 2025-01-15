import { SignOut } from "@/components/sign-out";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Chat } from "@/components/chat";
const Page = async () => {
  const session = await auth();
  if (!session) redirect("/sign-in");

  return (
    <>
      <SignOut />
      <div className="bg-gray-100 rounded-lg p-4 text-center mb-6">
        {/*<div className="mx-auto flex w-full max-w-md flex-col py-8">*/}
        <Chat email={session.user?.email} name={session.user?.name} />
        {/*</div>*/}
        {/* <p>{JSON.stringify(session.user)}</p> */}
      </div>
    </>
  );
};

export default Page;
