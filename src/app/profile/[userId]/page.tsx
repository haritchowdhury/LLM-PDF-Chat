import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import db from "@/lib/db/db";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  MessageSquareText,
  Boxes,
  PlusCircle,
  User,
  BookOpen,
  Briefcase,
  Share2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardTitle,
  CardHeader,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import Share from "@/components/Share";
import Delete from "@/components/Delete";
import { headers } from "next/headers";
import EditableUsername from "@/components/EditableUsername";
import ShareLinkModel from "@/components/ShareLink";

type Params = Promise<{ userId: any }>;

const Profile = async ({ params }: { params: Params }) => {
  const session = await auth();
  if (!session) redirect("/sign-in");
  let { userId } = await params;

  const betaTester = await db.betatesters.findFirst({
    where: {
      email: session?.user.email,
    },
  });
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

  const isOwnProfile = user?.id === session?.user.id;

  return (
    <main className="flex relative justify-center bg-gradient-to-br from-blue-50 to-green-50 text-white min-h-screen overflow-hidden">
      <div className="w-full max-w-6xl px-4 py-20 flex flex-col">
        {/* Profile Header */}
        {user && (
          <Card className="bg-white border-none mb-6 overflow-hidden">
            <CardHeader className="pb-4 border-none">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-gray-800">
                    <User size={28} className="text-gray-400" />
                  </div>
                  <div>
                    {isOwnProfile ? (
                      <EditableUsername
                        initialUsername={user.name}
                        userId={user.id}
                      />
                    ) : (
                      <CardTitle className="text-xl font-bold text-gray-200">
                        {user.name}
                      </CardTitle>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}

        {isOwnProfile && user ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 flex-grow">
            {/* Publications Section */}
            <Card className="bg-white border-none h-full">
              <CardHeader className="pb-3 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <BookOpen size={18} className="text-gray-400" />
                    <CardTitle className="text-lg font-medium text-gray-800">
                      Publications
                    </CardTitle>
                  </div>
                  {betaTester ? (
                    shares.length < 3 ? (
                      <Share namespace={"undefined"} />
                    ) : null
                  ) : shares.length < 1 ? (
                    <Share namespace={"undefined"} />
                  ) : null}
                </div>
                <CardDescription className="text-gray-600 text-sm">
                  Share articles with friends and earn when milestones are
                  unlocked
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 max-h-[40vh] overflow-y-auto">
                {!shares.length ? (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                    <Share2 size={40} className="mb-2 opacity-50" />
                    <p className="text-sm">No publications yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {shares.map((share) => (
                      <div
                        key={share.id}
                        className="flex items-center justify-between p-2 rounded-md bg-gray-800 hover:bg-gray-700 transition-colors"
                      >
                        <div
                          className="overflow-hidden text-ellipsis whitespace-nowrap max-w-[70%] text-gray-200"
                          title={share.name}
                        >
                          {share.name}
                        </div>
                        <div className="flex gap-1">
                          <Link
                            href={`/chat/${share.id}`}
                            className={buttonVariants({
                              variant: "outline",
                              // size: "lg",
                              className:
                                "bg-gradient-to-b from-indigo-200 border-gray-300 text-gray-800 hover:bg-gray-800 my-2",
                            })}
                          >
                            <MessageSquareText size={14} className="mr-1" />
                            Open
                          </Link>
                          <ShareLinkModel link={`${platformlink}${share.id}`} />

                          <Delete upload={share.id as string} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-2 border-t border-gray-200">
                {betaTester
                  ? shares.length >= 3 && (
                      <div className="text-red-500 text-xs w-full text-center">
                        You have reached maximum numbers of Publications (3)
                      </div>
                    )
                  : shares.length >= 1 && (
                      <div className="text-red-500 text-xs w-full text-center">
                        You have reached maximum numbers of Publications (1)
                      </div>
                    )}
              </CardFooter>
            </Card>

            {/* Workspaces Section */}
            <Card className="bg-white border-none h-full">
              <CardHeader className="pb-3 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Briefcase size={18} className="text-gray-400" />
                    <CardTitle className="text-lg font-medium text-gray-800">
                      Workspaces
                    </CardTitle>
                  </div>
                  {betaTester ? (
                    Uploads.length < 3 ? (
                      <Link
                        href={`/chat/undefined`}
                        className={buttonVariants({
                          variant: "outline",
                          // size: "lg",
                          className:
                            "bg-gradient-to-b from-indigo-200 border-gray-300 text-gray-800 hover:bg-gray-800 my-2",
                        })}
                      >
                        <PlusCircle size={14} className="mr-1" />
                        New
                      </Link>
                    ) : null
                  ) : Uploads.length < 1 ? (
                    <Link
                      href={`/chat/undefined`}
                      className={buttonVariants({
                        variant: "outline",
                        //size: "lg",
                        className:
                          "bg-gradient-to-b from-indigo-200 border-gray-300 text-gray-800 hover:bg-gray-800 my-2",
                      })}
                    >
                      <PlusCircle size={14} className="mr-1" />
                      New
                    </Link>
                  ) : null}
                </div>
                <CardDescription className="text-gray-600 text-sm">
                  Start a private workspace for your content
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 max-h-[40vh] overflow-y-auto">
                {!Uploads.length ? (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                    <Briefcase size={40} className="mb-2 opacity-50" />
                    <p className="text-sm">No workspaces yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {Uploads.map((upload) => (
                      <div
                        key={upload.id}
                        className="flex items-center justify-between p-2 rounded-md bg-gray-800 hover:bg-gray-700 transition-colors"
                      >
                        <div
                          className="overflow-hidden text-ellipsis whitespace-nowrap max-w-[70%] text-gray-200"
                          title={upload.name}
                        >
                          {upload.name}
                        </div>
                        <div className="flex gap-1">
                          <Link
                            href={`/chat/${upload.id}`}
                            className={buttonVariants({
                              variant: "outline",
                              // size: "lg",
                              className:
                                "bg-gradient-to-b from-indigo-200 border-gray-300 text-gray-800 hover:bg-gray-800 my-2",
                            })}
                          >
                            <MessageSquareText size={14} className="mr-1" />
                            Open
                          </Link>
                          <Delete upload={upload.id as string} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-2 border-t border-gray-200">
                {betaTester
                  ? Uploads.length >= 3 && (
                      <div className="text-red-500 text-xs w-full text-center">
                        You have reached maximum numbers of Workspaces (3)
                      </div>
                    )
                  : Uploads.length >= 1 && (
                      <div className="text-red-500 text-xs w-full text-center">
                        You have reached maximum numbers of Workspaces (1)
                      </div>
                    )}
              </CardFooter>
            </Card>
          </div>
        ) : (
          <div className="gap-16">
            <CardHeader className="pb-3 border-b border-gray-800 rounded border-black">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 p-4 bg-gray-600 rounded">
                  Articles Published by the Author
                </div>
              </div>
            </CardHeader>
            <div className="grid grid-cols-1 gap-2">
              {shares.map((share) => (
                <div
                  key={share.id}
                  className="flex items-center justify-between p-2 rounded-md bg-gray-800 hover:bg-gray-700 transition-colors"
                >
                  <div
                    className="overflow-hidden text-ellipsis whitespace-nowrap max-w-[70%] text-gray-200"
                    title={share.name}
                  >
                    {share.name}
                  </div>
                  <div className="flex gap-1">
                    <Link
                      href={`/chat/${share.id}`}
                      className={buttonVariants({
                        variant: "outline",
                        //size: "lg",
                        className:
                          "bg-gradient-to-b from-indigo-200 border-gray-300 text-gray-800 hover:bg-gray-800 my-2",
                      })}
                    >
                      <MessageSquareText size={14} className="mr-1" />
                      Open
                    </Link>
                    <ShareLinkModel link={`${platformlink}${share.id}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quizzes Section */}
        {isOwnProfile && user && (
          <Card className="bg-white border-none">
            <CardHeader className="pb-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Boxes size={18} className="text-gray-400" />
                <CardTitle className="text-lg font-medium text-gray-800">
                  Quizzes
                </CardTitle>
              </div>
              <CardDescription className="text-gray-600 text-sm">
                Track your quiz performance and results
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 max-h-[50vh] overflow-y-auto">
              {!games.length ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                  <Boxes size={40} className="mb-2 opacity-50" />
                  <p className="text-sm">No quizzes taken yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {games.map((game) => (
                    <Link
                      key={game.id}
                      href={`/statistics/${game.id}`}
                      className="flex items-center justify-between p-3 rounded-md bg-gray-800 hover:bg-gray-700 transition-colors"
                    >
                      <div
                        className="overflow-hidden text-ellipsis whitespace-nowrap max-w-[70%] text-gray-200"
                        title={game.topic}
                      >
                        {game.topic}
                      </div>
                      <Boxes size={16} className="text-gray-400" />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
};

export default Profile;
