"use client";
import { useState } from "react";
import { UserRoundPen, Check, X } from "lucide-react";

type Props = {
  initialUsername: string;
  userId: string;
};

const EditableUsername = ({ initialUsername, userId }: Props) => {
  const [username, setUsername] = useState(initialUsername || "John Doe");
  const [isEditing, setIsEditing] = useState(false);
  const [tempUsername, setTempUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleEditClick = () => {
    setTempUsername(username);
    setIsEditing(true);
    setError(null);
  };

  const handleSave = async () => {
    if (tempUsername.trim() === "") {
      setError("Username cannot be empty");
      return;
    }

    setIsLoading(true);
    try {
      // Make API call to update the username in Prisma
      const response = await fetch("/api/updateUsername", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          newUsername: tempUsername,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update username");
      }

      // Update local state with the new username
      setUsername(tempUsername);
      setIsEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
  };

  const handleChange = (e) => {
    setTempUsername(e.target.value);
    if (error) setError(null);
  };

  return (
    <div className="w-full max-w-md bg-gray-700 text-gray-200 rounded-lg shadow p-3">
      {isEditing ? (
        <div className="space-y-3">
          {/* Input field - full width on mobile */}
          <div className="w-full">
            <input
              type="text"
              value={tempUsername}
              onChange={handleChange}
              className="w-full px-3 py-2 text-black border border-gray-300 bg-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              autoFocus
              disabled={isLoading}
              placeholder="Enter username"
            />
          </div>

          {/* Buttons - responsive layout */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={handleSave}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-md focus:outline-none focus:ring-2 transition-colors ${
                isLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-500 hover:bg-green-600 text-white focus:ring-green-500"
              }`}
              disabled={isLoading}
            >
              <Check className="h-4 w-4" />
              <span className="hidden sm:inline">
                {isLoading ? "Saving..." : "Save"}
              </span>
            </button>

            <button
              onClick={handleCancel}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
              disabled={isLoading}
            >
              <X className="h-4 w-4" />
              <span className="hidden sm:inline">Cancel</span>
            </button>
          </div>

          {/* Error message */}
          {error && (
            <p className="text-red-400 text-sm bg-red-900/20 px-2 py-1 rounded border border-red-500/30">
              {error}
            </p>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg sm:text-xl font-medium text-white truncate flex-1 min-w-0">
            {username}
          </h2>
          <button
            onClick={handleEditClick}
            className="flex-shrink-0 p-2 text-gray-400 rounded-full hover:bg-gray-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            aria-label="Edit username"
          >
            <UserRoundPen className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default EditableUsername;
