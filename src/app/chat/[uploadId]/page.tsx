import Chat from "@/components/Chat";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import db from "@/lib/db/db";
//import { Card, CardContent, CardTitle } from "@/components/ui/card";

type Params = Promise<{ uploadId: any /* chatSession: any; space: any*/ }>;

const ChatPage = async ({ params }: { params: Params }) => {
  const session = await auth();
  if (!session) redirect("/sign-in");
  const email = String(session.user?.email);
  const id = String(session.user.id);

  let { uploadId } = await params;

  const chatSession = (uploadId + "_" + session?.user.id) as string;
  const space = uploadId;

  let personal = true;

  if (uploadId !== "undefined") {
    const lastUpload = await db.upload.findFirst({
      where: {
        id: uploadId,
      },
    });
    personal = lastUpload.private;
    //console.log(lastUpload);
    if (!lastUpload) {
      redirect("/sign-in");
    }
    if (lastUpload.private == true && lastUpload.userId !== id) {
      redirect("/sign-in");
    }
    if (lastUpload.userId === id) {
      personal = true;
    }
  }
  console.log(personal);
  return (
    <>
      <main className="flex relative items-center justify-center min-h-screen bg-black">
        {/*  <Card className="p-3 bg-black border-gray-900 text-gray-200 flex flex-col items-center gap-4 w-full max-w-md overflow-y-auto">
          <small>Upload your documents using the tooltip.</small>
          
          <small>Happy Skimming!</small>
        </Card> */}
        <Chat
          email={email}
          upload={uploadId}
          sessionId={chatSession}
          namespace={space}
          personal={personal}
          userId={session?.user.id}
        />
      </main>
    </>
  );
};

export default ChatPage;
