"use client";

import { useState } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  MessageSquareText,
  Boxes,
  PlusCircle,
  BookOpen,
  Briefcase,
  Share2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardTitle,
  CardHeader,
  CardDescription,
} from "@/components/ui/card";
import Share from "@/components/Share";
import Delete from "@/components/Delete";
import ShareLinkModel from "@/components/ShareLink";

interface Upload {
  id: string;
  name: string;
  private: boolean;
  isDeleted: boolean;
}

interface Game {
  id: string;
  topic: string;
}

interface RoomsDisplayProps {
  shares: Upload[];
  uploads: Upload[];
  games: Game[];
  platformlink: string;
}

export default function RoomsDisplay({
  shares,
  uploads,
  games,
  platformlink,
}: RoomsDisplayProps) {
  const [showPublic, setShowPublic] = useState(true);

  return (
    <div className="space-y-6 mb-6">
      <div>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-800">
              Classrooms Created by Me
            </h2>
            <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-md">
              <button
                onClick={() => setShowPublic(true)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  showPublic
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Public
              </button>
              <button
                onClick={() => setShowPublic(false)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  !showPublic
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Private
              </button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rooms Section - Conditional */}
          {showPublic ? (
            <Card className="bg-white border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-blue-50">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200">
                      <BookOpen size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-semibold text-gray-800">
                        Public Classrooms
                      </CardTitle>
                      <CardDescription className="text-gray-600 text-sm mt-1">
                        Share with friends and earn rewards
                      </CardDescription>
                    </div>
                  </div>
                  <Share namespace={"undefined"} />
                </div>
              </CardHeader>
              <CardContent className="pt-5 max-h-[45vh] overflow-y-auto">
                {!shares.length ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <div className="p-4 rounded-full bg-blue-50 mb-4">
                      <Share2 size={32} className="text-blue-300" />
                    </div>
                    <p className="text-base font-medium text-gray-700">
                      No public classrooms yet
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Create and share your first classroom
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {shares.map((share) => (
                      <div
                        key={share.id}
                        className="group flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                      >
                        <div
                          className="overflow-hidden text-ellipsis whitespace-nowrap flex-1 text-gray-800 font-medium"
                          title={share.name}
                        >
                          {share.name}
                        </div>
                        <div className="flex gap-2 items-center ml-3">
                          <Link
                            href={`/chat/${share.id}`}
                            className={buttonVariants({
                              variant: "outline",
                              size: "sm",
                              className:
                                "bg-white border-blue-200 text-blue-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all",
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
            </Card>
          ) : (
            <Card className="bg-white border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-green-50">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200">
                      <Briefcase size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-semibold text-gray-800">
                        Private Workspaces
                      </CardTitle>
                      <CardDescription className="text-gray-600 text-sm mt-1">
                        Personal workspace for your content
                      </CardDescription>
                    </div>
                  </div>
                  <Link
                    href={`/chat/undefined`}
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                      className:
                        "bg-white border-blue-200 text-blue-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all",
                    })}
                  >
                    <PlusCircle size={14} className="mr-1" />
                    New
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="pt-5 max-h-[45vh] overflow-y-auto">
                {!uploads.length ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <div className="p-4 rounded-full bg-blue-50 mb-4">
                      <Briefcase size={32} className="text-blue-300" />
                    </div>
                    <p className="text-base font-medium text-gray-700">
                      No private workspaces yet
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Create your first private workspace
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {uploads.map((upload) => (
                      <div
                        key={upload.id}
                        className="group flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                      >
                        <div
                          className="overflow-hidden text-ellipsis whitespace-nowrap flex-1 text-gray-800 font-medium"
                          title={upload.name}
                        >
                          {upload.name}
                        </div>
                        <div className="flex gap-2 items-center ml-3">
                          <Link
                            href={`/chat/${upload.id}`}
                            className={buttonVariants({
                              variant: "outline",
                              size: "sm",
                              className:
                                "bg-white border-blue-200 text-blue-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all",
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
            </Card>
          )}

          {/* Quizzes Section - Always Visible */}
          <Card className="bg-white border-none shadow-lg">
            <CardHeader className="pb-4 bg-gradient-to-r from-green-50 to-blue-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-green-100 to-green-200">
                    <Boxes size={20} className="text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold text-gray-800">
                      Quiz History
                    </CardTitle>
                    <CardDescription className="text-gray-600 text-sm mt-1">
                      Track your quiz performance and results
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
                  <Boxes size={16} className="text-green-600" />
                  <span className="text-sm font-semibold text-gray-700">
                    {games.length} {games.length === 1 ? "quiz" : "quizzes"}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-5 max-h-[45vh] overflow-y-auto">
              {!games.length ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <div className="p-4 rounded-full bg-green-50 mb-4">
                    <Boxes size={32} className="text-green-300" />
                  </div>
                  <p className="text-base font-medium text-gray-700">
                    No quizzes taken yet
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Start a quiz to see your results here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {games.map((game) => (
                    <Link
                      key={game.id}
                      href={`/statistics/${game.id}`}
                      className="group flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-gray-50 to-green-50 border border-gray-200 hover:border-green-300 hover:shadow-md transition-all duration-200"
                    >
                      <div
                        className="overflow-hidden text-ellipsis whitespace-nowrap flex-1 text-gray-800 font-medium group-hover:text-green-700"
                        title={game.topic}
                      >
                        {game.topic}
                      </div>
                      <Boxes
                        size={18}
                        className="text-green-400 group-hover:text-green-600 ml-2 transition-colors"
                      />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
