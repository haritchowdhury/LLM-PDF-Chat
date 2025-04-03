import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import db from "@/lib/db/db";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { MessageSquareText, Boxes } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import Share from "@/components/Share";
import Delete from "@/components/Delete";
import { headers } from "next/headers";
import Shares from "@/components/Shares";
import Withdrawl from "@/components/Withdrawl";
import EditableUsername from "@/components/EditableUsername";

type Params = Promise<{ userId: any }>;

const Profile = async ({ params }: { params: Params }) => {
  const session = await auth();
  if (!session) redirect("/sign-in");
  let { userId } = await params;
  /* if (userId != session?.user.id) {
    redirect("/sign-in");
  }*/
  const headersList = await headers();
  const host = await headersList.get("host");
  const platformlink = `http://${host as string}/chat/`;
  const user = await db.user.findFirst({
    where: { id: userId },
  });
  const Uploads = await db.upload.findMany({
    where: { userId: session?.user.id, private: true, isDeleted: false },
    orderBy: { timeStarted: "desc" },
  });
  const games = await db.game.findMany({
    where: { userId: session?.user.id },
    orderBy: { timeStarted: "desc" },
  });
  const shares = await db.upload.findMany({
    where: { userId: userId, private: false, isDeleted: false },
    orderBy: { timeStarted: "desc" },
  });

  return (
    <>
      <main className="flex relative items-center justify-center min-h-screen bg-black text-white">
        <Card
          className="flex flex-col gap-4 text-white bg-black border-none p-12 
                     h-[90vh] overflow-y-auto w-full max-w-md sm:max-w-4xl lg:max-w-4xl mt-4 sm:mt-8"
        >
          <Card className="flex flex-row item-center justify-center p-3 gap-1 bg-black border-none text-gray-200">
            {user.id === session?.user.id ? (
              <div className="flex flex-col sm:flex-col gap-3 mt-2 ">
                <EditableUsername
                  initialUsername={user.name}
                  userId={user.id}
                />
              </div>
            ) : (
              user.name
            )}
          </Card>
          <Card className="flex flex-row item-center justify-center p-3 gap-1 bg-black border-gray-900 text-gray-200">
            {user.id === session?.user.id && (
              <div className="flex  sm:flex-row gap-3 mt-2">
                <Withdrawl />
              </div>
            )}
          </Card>

          {userId === session.user.id && (
            <>
              <Card className="flex justify-center w-full bg-gray-800 text-gray-200 border-none p-1 font-bold">
                <div>Publish article, and share with your friends.</div>
              </Card>
              <Share namespace={"undefined"} />
              <Card className="flex justify-center w-full bg-gray-800 text-gray-200 p-2 border-none p-1 font-bold">
                <div>Start a private workspacen.</div>
              </Card>
              <div className="flex justify-center w-full">
                <Link
                  href={`/chat/undefined`}
                  className={` flex ${buttonVariants()} w-fit items-center  w-fit`}
                >
                  Create Workspace
                  <MessageSquareText />
                </Link>
              </div>
            </>
          )}

          <Shares
            shares={shares}
            userId={userId}
            currentUser={session?.user.id}
            platformlink={platformlink}
          />

          {userId === session.user.id && (
            <>
              {" "}
              <Card className="p-3 bg-black border-gray-900 text-gray-200">
                <Card className="flex justify-center w-full bg-gray-800 text-gray-200 p-2 border-none font-bold">
                  Your Workspaces
                </Card>
                <div className="flex flex-wrap gap-3 mt-2">
                  {!Uploads.length && (
                    <div>
                      <small>You have no private chatrooms!</small>
                    </div>
                  )}
                  {Uploads.map((upload) => (
                    <div key={upload.id} className="gap-1 flex flex-row">
                      <Link
                        href={`/chat/${upload.id}`}
                        className={buttonVariants()}
                      >
                        {upload.name.slice(0, 25)}
                        <MessageSquareText />
                      </Link>
                      <Delete upload={upload.id as string} />
                    </div>
                  ))}
                </div>
              </Card>
              <Card className="p-3 flex flex-wrap bg-black gap-1 border-gray-800 text-gray-200">
                <Card className="flex justify-center w-full bg-gray-800 text-gray-200 p-2 font-bold border-none">
                  Your Quizzes
                </Card>
                {!games.length && (
                  <div>
                    <small>You have not taken any quizzes!</small>
                  </div>
                )}

                {games.map((game) => (
                  <div key={game.id} className="gap-1">
                    <Link
                      href={`/statistics/${game.id}`}
                      className={buttonVariants()}
                    >
                      {game.topic}
                      <Boxes />
                    </Link>
                  </div>
                ))}
              </Card>
            </>
          )}
        </Card>
      </main>
    </>
  );
};

export default Profile;
