import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import db from "@/lib/db/db";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { MessageSquareText, Boxes } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import Share from "@/components/Share";
import Delete from "@/components/Delete";
import ShareLinkModel from "@/components/ShareLink";
import { headers } from "next/headers";

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
  const Shares = await db.upload.findMany({
    where: { userId: userId, private: false, isDeleted: false },
    orderBy: { timeStarted: "desc" },
  });

  return (
    <>
      <main className="flex relative items-center justify-center min-h-screen bg-black text-white">
        <Card
          className="flex flex-col gap-4 text-white bg-black border-gray-800 p-12 
                             h-[90vh] overflow-y-auto w-full max-w-md sm:max-w-lg lg:max-w-2xl mt-4 sm:mt-8"
        >
          <Card className="p-3 bg-black border-gray-900 text-gray-200">
            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              {user.name}
              {user.email}
            </div>
          </Card>

          {userId === session.user.id && (
            <>
              <Share namespace={"undefined"} />
              <Card className="flex justify-center w-full bg-gray-800 text-gray-200 border-none p-1 font-bold">
                <div>
                  Your uploads through this will be shared with the community.
                  Be mindful!
                </div>
              </Card>

              <div className="flex justify-center w-full">
                <Link
                  href={`/chat/undefined`}
                  className={` flex ${buttonVariants()} w-fit items-center  w-fit`}
                >
                  Upload a new document
                  <MessageSquareText />
                </Link>
              </div>
              <Card className="flex justify-center w-full bg-gray-800 text-gray-200 p-2 border-none p-1 font-bold">
                <div>Start a private conversation.</div>
              </Card>
            </>
          )}

          <Card className="p-3 bg-black border-gray-900 text-gray-200">
            <Card className="flex justify-center w-full bg-gray-800 text-gray-200 p-2 border-none font-bold">
              Published Articles
            </Card>
            <div className="flex flex-col sm:flex-row gap-2 mt-2">
              {!Shares.length && (
                <div>
                  <small>You have not shared anything yet!</small>
                </div>
              )}
              {Shares.map((share) => (
                <div key={share.id} className="gap-1 flex flex-row">
                  <Link href={`/chat/${share.id}`} className={buttonVariants()}>
                    {share.name.slice(0, 25)}
                    <MessageSquareText />
                  </Link>
                  {userId === session.user.id && (
                    <Delete upload={share.id as string} />
                  )}
                  <ShareLinkModel link={`${platformlink}${share.id}`} />
                </div>
              ))}
            </div>
          </Card>
          {userId === session.user.id && (
            <>
              {" "}
              <Card className="p-3 bg-black border-gray-900 text-gray-200">
                <Card className="flex justify-center w-full bg-gray-800 text-gray-200 p-2 border-none font-bold">
                  Your Conversations
                </Card>
                <div className="flex flex-row sm:flex-row gap-3 mt-2">
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
              <Card className="p-3 flex flex-col bg-black border-gray-800 text-gray-200">
                <Card className="flex justify-center w-full bg-gray-800 text-gray-200 p-2 font-bold border-none">
                  Your Quizzes
                </Card>
                <div className="flex flex-row sm:flex-row gap-3 mt-2">
                  {!games.length && (
                    <div>
                      <small>You have not taken any quizzes!</small>
                    </div>
                  )}
                  <div className="gap-1">
                    {games.map((game) => (
                      <Link
                        key={game.id}
                        href={`/statistics/${game.id}`}
                        className={buttonVariants()}
                      >
                        {game.topic}
                        <Boxes />
                      </Link>
                    ))}
                  </div>
                </div>
              </Card>
            </>
          )}
        </Card>
      </main>
    </>
  );
};

export default Profile;
