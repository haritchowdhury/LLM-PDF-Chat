import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Chat } from "@/components/chat";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
const Page = async () => {
  const session = await auth();
  if (!session) redirect("/sign-in");
  const email = String(session.user?.email);
  return (
    <>
      <Header />
      <main>
        {/*<div className="mx-auto flex w-full max-w-md flex-col py-8">*/}
        <Chat email={email} />
        {/*</div>*/}
        {/* <p>{JSON.stringify(session.user)}</p> */}
      </main>
      <Footer />
    </>
  );
};

export default Page;
