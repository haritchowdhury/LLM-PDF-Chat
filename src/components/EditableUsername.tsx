"use client";
import { useState } from "react";
import { UserRoundPen } from "lucide-react";

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
    <div className="px-2 max-w-md ml-0 bg-gray-400 text-gray-200 bg-gray-700 rounded-lg shadow">
      {isEditing ? (
        <div className="space-y-2">
          <div className="flex items-center space-x-2 p-1">
            <input
              type="text"
              value={tempUsername}
              onChange={handleChange}
              className="flex-1 px-3 py-2 text-black border border-gray-300 bg-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
              disabled={isLoading}
            />
            <button
              onClick={handleSave}
              className={`px-3 py-2 ${isLoading ? "bg-gray-400" : "bg-green-500 hover:bg-gray-800"} text-black rounded-md focus:outline-none focus:ring-2 focus:ring-green-500`}
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save"}
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              disabled={isLoading}
            >
              Cancel
            </button>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2 px-2">
          <h2 className="text-xl font-medium text-white">{username}</h2>
          <button
            onClick={handleEditClick}
            className="p-2 text-gray-400 rounded-full hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <UserRoundPen />
          </button>
        </div>
      )}
    </div>
  );
};

export default EditableUsername;
