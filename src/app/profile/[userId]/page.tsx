import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import db from "@/lib/db/db";
import Link from "next/link";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";
import { MessageSquareText, User, BookOpen } from "lucide-react";
import {
  Card,
  CardContent,
  CardTitle,
  CardHeader,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { headers } from "next/headers";
import EditableUsername from "@/components/EditableUsername";
import ShareLinkModel from "@/components/ShareLink";
import RoomsDisplay from "@/components/RoomsDisplay";

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
      <div className="w-full max-w-7xl px-4 py-20 flex flex-col">
        {/* Enhanced Profile Header */}
        {user && (
          <Card className="bg-white border-none mb-8 overflow-hidden shadow-lg">
            <CardHeader className="pb-6 border-none bg-gradient-to-r from-indigo-50 via-blue-50 to-green-50">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-blue-200 ring-4 ring-white shadow-md overflow-hidden flex items-center justify-center">
                    {user.image ? (
                      <Image
                        src={user.image}
                        alt={user.name || "User avatar"}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <User size={32} className="text-indigo-600" />
                    )}
                  </div>
                  <div>
                    {isOwnProfile ? (
                      <EditableUsername
                        initialUsername={user.name}
                        userId={user.id}
                      />
                    ) : (
                      <CardTitle className="text-2xl font-bold text-gray-800">
                        {user.name}
                      </CardTitle>
                    )}
                  </div>
                </div>
                {isOwnProfile && (
                  <div className="flex gap-6 bg-white px-6 py-3 rounded-lg shadow-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-indigo-600">
                        {shares.length}
                      </div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">
                        Public
                      </div>
                    </div>
                    <div className="border-l border-gray-200"></div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {Uploads.length}
                      </div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">
                        Private
                      </div>
                    </div>
                    <div className="border-l border-gray-200"></div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {games.length}
                      </div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">
                        Quizzes
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
          </Card>
        )}

        {isOwnProfile && user ? (
          <RoomsDisplay
            shares={shares}
            uploads={Uploads}
            games={games}
            platformlink={platformlink}
          />
        ) : (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Published Classrooms
              </h2>
              <Card className="bg-white border-none shadow-lg overflow-hidden">
                <CardHeader className="pb-4 bg-gradient-to-r from-indigo-50 via-blue-50 to-green-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-200">
                        <BookOpen size={20} className="text-indigo-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-semibold text-gray-800">
                          Articles by {user?.name}
                        </CardTitle>
                        <CardDescription className="text-gray-600 text-sm mt-1">
                          Explore public classrooms shared by this author
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
                      <BookOpen size={16} className="text-indigo-600" />
                      <span className="text-sm font-semibold text-gray-700">
                        {shares.length}{" "}
                        {shares.length === 1 ? "article" : "articles"}
                      </span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  {shares.length === 0 ? (
                    <div className="text-center py-16 text-gray-500">
                      <div className="p-5 rounded-full bg-indigo-50 inline-flex items-center justify-center mb-4">
                        <BookOpen size={36} className="text-indigo-300" />
                      </div>
                      <p className="text-lg font-semibold text-gray-700 mb-2">
                        No articles published yet
                      </p>
                      <p className="text-sm text-gray-500">
                        This author hasn't published any classrooms yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {shares.map((share, index) => (
                        <div
                          key={share.id}
                          className="group flex items-center justify-between p-5 rounded-xl bg-gradient-to-r from-gray-50 to-indigo-50 border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-300"
                        >
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-full flex items-center justify-center text-indigo-700 font-bold text-sm shadow-sm">
                              {index + 1}
                            </div>
                            <div
                              className="overflow-hidden text-ellipsis whitespace-nowrap flex-1 text-gray-800 group-hover:text-indigo-800 font-semibold text-base"
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
                                  "bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all duration-200 shadow-sm",
                              })}
                            >
                              <MessageSquareText size={14} className="mr-2" />
                              Open
                            </Link>
                            <ShareLinkModel
                              link={`${platformlink}${share.id}`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default Profile;
