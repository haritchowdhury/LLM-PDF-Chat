import Chat from "@/components/Chat/Chat";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import db from "@/lib/db/db";
import { Upload, Game } from "@prisma/client";

type Params = Promise<{ uploadId: any }>;

const ChatPage = async ({ params }: { params: Params }) => {
  const session = await auth();
  if (!session) redirect("/sign-in");
  const email = String(session.user?.email);
  const id = String(session.user.id);

  let { uploadId } = await params;

  const chatSession = (uploadId + "_" + session?.user.id) as string;
  const space = uploadId;

  let personal = true;
  let publisher: string;

  if (uploadId !== "undefined") {
    const lastUpload = await db.upload.findFirst({
      where: {
        id: uploadId,
      },
    });
    personal = lastUpload.private;
    publisher = lastUpload.userId;
    if (!lastUpload) {
      redirect("/sign-in");
    }
    if (lastUpload.private == true && lastUpload.userId !== id) {
      redirect("/sign-in");
    }
    if (lastUpload.userId !== id) {
      personal = false;
    }
  } /*else {
    const betaTester = await db.betatesters.findFirst({
      where: {
        email: session?.user.email,
      },
    });

    const Uploads = await db.upload.findMany({
      where: { userId: session?.user.id, private: true, isDeleted: false },
      orderBy: { timeStarted: "desc" },
    });

    if (betaTester) {
      if (Uploads.length >= 3) {
        redirect(`/profile/${session?.user.id}`);
      }
    } else {
      if (Uploads.length >= 1) {
        redirect(`/profile/${session?.user.id}`);
      }
    }
  } */
  let Uploads: Upload[];
  if (personal) {
    Uploads = await db.upload.findMany({
      where: { userId: session?.user.id, private: true, isDeleted: false },
      orderBy: { timeStarted: "desc" },
    });
  } else {
    Uploads = await db.upload.findMany({
      where: { userId: session?.user.id, private: false, isDeleted: false },
      orderBy: { timeStarted: "desc" },
    });
  }

  const Games: Game[] = await db.game.findMany({
    where: { userId: session?.user.id, uploadId: uploadId },
    orderBy: { timeStarted: "desc" },
  });
  console.log(personal, Uploads, Games);
  return (
    <>
      <main className="flex relative items-center justify-center min-h-screen bg-black pb-16 pt-16">
        <Chat
          sessionId={chatSession}
          namespace={space}
          isPersonal={personal}
          userId={session?.user.id}
          workspaces={Uploads}
          games={Games}
        />
      </main>
    </>
  );
};

export default ChatPage;
