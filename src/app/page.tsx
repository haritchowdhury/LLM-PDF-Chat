import Chat from "@/components/Chat";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import db from "@/lib/db/db";

const Page = async () => {
  const session = await auth();
  if (!session) redirect("/sign-in");
  const email = String(session.user?.email);
  const id = String(session.user.id);
  const lastUpload = await db.upload.findFirst({
    where: {
      userId: id,
    },
    orderBy: {
      timeStarted: "desc",
    },
  });
  return (
    <>
      <main className="flex relative items-center justify-center min-h-screen bg-black">
        <Chat email={email} upload={lastUpload?.id} />
      </main>
    </>
  );
};

export default Page;
