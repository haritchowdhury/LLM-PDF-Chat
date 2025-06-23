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
                  {/* <div className="p-2 rounded-full bg-gray-800">
                    <User size={28} className="text-gray-400" />
                  </div> */}
                  <div>
                    {isOwnProfile ? (
                      <EditableUsername
                        initialUsername={user.name}
                        userId={user.id}
                      />
                    ) : (
                      <CardTitle className="text-xl font-bold text-gray-800">
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
                <h1 className="text-xl">Classrooms created by me</h1>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <BookOpen size={18} className="text-gray-400" />
                    <CardTitle className="text-lg font-medium text-gray-800">
                      Public
                    </CardTitle>
                  </div>
                  <Share namespace={"undefined"} />
                  {/*  {betaTester ? (
                    shares.length < 3 ? (
                      <Share namespace={"undefined"} />
                    ) : null
                  ) : shares.length < 1 ? (
                    <Share namespace={"undefined"} />
                  ) : null} */}
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
                        className="group flex items-center justify-between p-2 rounded-md bg-white border border-gray-200 hover:bg-gray-700 transition-colors"
                      >
                        <div
                          className="overflow-hidden text-ellipsis whitespace-nowrap max-w-[70%] text-gray-800 group-hover:!text-white"
                          title={share.name}
                        >
                          {share.name}
                        </div>
                        <div className="flex gap-4 items-center">
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
              {/*   <CardFooter className="pt-2 border-t border-gray-200">
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
              </CardFooter> */}
            </Card>

            {/* Workspaces Section */}
            <Card className="bg-white border-none h-full">
              <CardHeader className="pb-3 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Briefcase size={18} className="text-gray-400" />
                    <CardTitle className="text-lg font-medium text-gray-800">
                      Private
                    </CardTitle>
                  </div>
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
                  {/*  {betaTester ? (
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
                  ) : null} */}
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
                        className="group flex items-center justify-between p-2 rounded-md bg-white border border-gray-200 hover:bg-gray-700 transition-colors"
                      >
                        <div
                          className="overflow-hidden text-ellipsis whitespace-nowrap max-w-[70%] text-gray-800 group-hover:!text-white"
                          title={upload.name}
                        >
                          {upload.name}
                        </div>
                        <div className="flex gap-1 items-center">
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
              {/* <CardFooter className="pt-2 border-t border-gray-200">
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
              </CardFooter> */}
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Articles Published by the Author
                  </h3>
                  <span className="ml-auto text-sm text-gray-500 bg-white px-2 py-1 rounded-full">
                    {shares.length} articles
                  </span>
                </div>
              </div>

              <div className="p-4">
                <div className="space-y-2">
                  {shares.map((share, index) => (
                    <div
                      key={share.id}
                      className="group flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-100 hover:bg-indigo-50 hover:border-indigo-200 transition-all duration-200 hover:shadow-sm"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-full flex items-center justify-center text-indigo-600 font-medium text-sm">
                          {index + 1}
                        </div>
                        <div
                          className="overflow-hidden text-ellipsis whitespace-nowrap flex-1 text-gray-700 group-hover:text-indigo-800 font-medium"
                          title={share.name}
                        >
                          {share.name}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Link
                          href={`/chat/${share.id}`}
                          className={buttonVariants({
                            variant: "outline",
                            size: "sm",
                            className:
                              "bg-white border-gray-300 text-gray-700 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all duration-200",
                          })}
                        >
                          <MessageSquareText size={14} className="mr-2" />
                          Open
                        </Link>
                        <ShareLinkModel link={`${platformlink}${share.id}`} />
                      </div>
                    </div>
                  ))}
                </div>

                {shares.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageSquareText size={24} className="text-gray-400" />
                    </div>
                    <p className="text-lg font-medium mb-2">
                      No articles published yet
                    </p>
                    <p className="text-sm">
                      Articles will appear here once they are published.
                    </p>
                  </div>
                )}
              </div>
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
                      className="group flex items-center justify-between p-2 rounded-md bg-white border border-gray-200 hover:bg-gray-700 transition-colors"
                    >
                      <div
                        className="overflow-hidden text-ellipsis whitespace-nowrap max-w-[70%] text-gray-800 group-hover:!text-white"
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
