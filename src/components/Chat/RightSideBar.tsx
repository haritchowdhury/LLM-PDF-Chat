import { Upload as PrismaUpload, Game } from "@prisma/client";
import { FileText, GamepadIcon, Clock, User } from "lucide-react";
import Link from "next/link";

type Prompts = {
  workspaces?: PrismaUpload[];
  games?: Game[];
};

function RightSideBar({ workspaces, games }: Prompts) {
  console.log(workspaces, games, "received at client");

  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="flex flex-col w-full md:w-64 flex-shrink-0 md:border-l md:border-gray-200 bg-gradient-to-br from-blue-50 to-green-50 h-full overflow-hidden">
      {/* Top Section - Uploads */}
      <div className="flex flex-col flex-1 md:h-1/2 overflow-hidden">
        <div className="p-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-800">Your Documents</h3>
          <span className="text-xs text-gray-800 bg-gray-200 px-2 py-1 rounded-full">
            {workspaces?.length || 0}
          </span>
        </div>

        <div className="flex-grow overflow-y-auto custom-scrollbar">
          {workspaces && workspaces.length > 0 ? (
            <div className="p-2">
              {workspaces.map((workspace) => (
                <Link
                  href={`/chat/${workspace.id}`}
                  key={workspace.id}
                  className="flex items-start p-3 md:p-2 hover:bg-gray-800 rounded-md group transition-colors border-b md:border-b-0 border-gray-300 last:border-b-0"
                >
                  <FileText className="w-4 h-4 mt-0.5 text-gray-500 group-hover:text-blue-400 flex-shrink-0" />
                  <div className="ml-3 md:ml-2 flex-grow min-w-0">
                    <p className="text-sm text-gray-800 truncate group-hover:text-blue-400 font-medium">
                      {workspace.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {workspace.timeStarted
                        ? formatDate(workspace.timeStarted)
                        : "Date unavailable"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
              <FileText className="w-8 h-8 text-gray-600 mb-2" />
              <p className="text-gray-400 text-sm">No documents found</p>
              <p className="text-gray-500 text-xs mt-1">
                Upload a document to get started
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section - Games */}
      <div className="flex flex-col flex-1 md:h-1/2 border-t border-gray-200">
        <div className="p-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-800">
            Workspace Quizzes
          </h3>
          <span className="text-xs text-gray-800 bg-gray-200 px-2 py-1 rounded-full">
            {games?.length || 0}
          </span>
        </div>

        <div className="flex-grow overflow-y-auto custom-scrollbar">
          {games && games.length > 0 ? (
            <div className="p-2">
              {games.map((game) => (
                <Link
                  href={`/statistics/${game.id}`}
                  key={game.id}
                  className="flex items-start p-3 md:p-2 hover:bg-gray-800 rounded-md group transition-colors border-b md:border-b-0 border-gray-800 last:border-b-0"
                >
                  <GamepadIcon className="w-4 h-4 mt-0.5 text-gray-500 group-hover:text-green-400 flex-shrink-0" />
                  <div className="ml-3 md:ml-2 flex-grow min-w-0">
                    <p className="text-sm text-gray-800 truncate group-hover:text-green-400 font-medium">
                      {game.topic || "Untitled Game"}
                    </p>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <Clock className="w-3 h-3 mr-1" />
                      <span>{formatDate(game.timeStarted)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
              <GamepadIcon className="w-8 h-8 text-gray-600 mb-2" />
              <p className="text-gray-400 text-sm">No games found</p>
              <p className="text-gray-500 text-xs mt-1">
                Start a new game to practice
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RightSideBar;
