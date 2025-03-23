import Chat from "@/components/Chat";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import db from "@/lib/db/db";

type Params = Promise<{ uploadId: any /* chatSession: any; space: any*/ }>;

const ChatPage = async ({ params }: { params: Params }) => {
  const session = await auth();
  if (!session) redirect("/sign-in");
  const email = String(session.user?.email);
  const id = String(session.user.id);

  let { uploadId /*, chatSession, space */ } = await params;

  const chatSession = (uploadId + "_" + session?.user.id) as string;
  const space = uploadId;

  if (uploadId !== "undefined") {
    const lastUpload = await db.upload.findFirst({
      where: {
        id: uploadId,
        userId: session?.user.id,
      },
    });

    if (!lastUpload) {
      redirect("/sign-in");
    }
  }

  /* if (!uploadId) {
    const lastUpload = await db.upload.findFirst({
      where: {
        userId: id,
      },
      orderBy: {
        timeStarted: "desc",
      },
    });
    uploadId = lastUpload?.id;
  }
  if (!chatSession) {
    chatSession = `${id}_session`;
  }
  if (!space) {
    space = `${id}_documents`;
  } */
  return (
    <>
      <main className="flex relative items-center justify-center min-h-screen bg-black">
        <Chat
          email={email}
          upload={uploadId}
          sessionId={chatSession}
          namespace={space}
        />
      </main>
    </>
  );
};

export default ChatPage;
