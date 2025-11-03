import Chat from "@/components/Chat/Chat";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import db from "@/lib/db/db";
import { Upload, Game } from "@prisma/client";

type Params = Promise<{ uploadId: any }>;

const ChatPage = async ({ params }: { params: Params }) => {
  const session = await auth();
  if (!session) {
    const { uploadId } = await params;
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(`/chat/${uploadId}`)}`);
  }

  const email = String(session.user?.email);
  const id = String(session.user.id);

  let { uploadId } = await params;

  const chatSession = (uploadId + "_" + session?.user.id) as string;
  const space = uploadId;

  let personal = true;
  let publisher: string;
  let lastUpload: Upload;

  if (uploadId !== "undefined") {
    lastUpload = await db.upload.findFirst({
      where: {
        id: uploadId,
      },
    });
    personal = lastUpload.private;
    publisher = lastUpload.userId;

    //console.log("Upload Id", lastUpload);

    if (!lastUpload) {
      redirect("/sign-in");
    }
    if (lastUpload.private == true && lastUpload.userId !== id) {
      redirect("/sign-in");
    }
    if (lastUpload.userId !== id) {
      personal = false;
    }
  }

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
  console.log("current upload: ", lastUpload);
  //console.log(personal, Uploads, Games);
  return (
    <>
      <main className="flex relative items-center justify-center min-h-screen bg-black pt-16 overflow-y-auto">
        <Chat
          sessionId={chatSession}
          namespace={space}
          isPersonal={personal}
          userId={session?.user.id}
          publisher={publisher}
          workspaces={Uploads}
          games={Games}
          upload={lastUpload}
        />
      </main>
    </>
  );
};

export default ChatPage;
