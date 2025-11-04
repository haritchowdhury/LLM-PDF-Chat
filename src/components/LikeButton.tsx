"use client";
import React, { useState } from "react";
import { Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type LikeButtonProps = {
  uploadId: string;
  initialLiked: boolean;
  initialLikeCount: number;
  userId?: string;
};

const LikeButton = ({
  uploadId,
  initialLiked,
  initialLikeCount,
  userId,
}: LikeButtonProps) => {
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLike = async () => {
    if (!userId) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to like this post",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const previousLiked = liked;
    const previousCount = likeCount;

    // Optimistic update
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);

    try {
      const response = await fetch(`/api/uploads/${uploadId}/like`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to toggle like");
      }

      const data = await response.json();
      setLiked(data.liked);
      setLikeCount(data.likeCount);
    } catch (error) {
      // Revert on error
      setLiked(previousLiked);
      setLikeCount(previousCount);
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLike}
      disabled={isLoading}
      className="flex items-center gap-2 text-gray-600 hover:text-blue-500 transition-colors disabled:opacity-50"
    >
      <Heart
        className={`h-5 w-5 transition-all ${
          liked
            ? "fill-blue-500 text-blue-500 scale-110"
            : "text-gray-500 hover:scale-110"
        }`}
      />
      <div>
        <p className="text-xs text-gray-500">Likes</p>
        <p className="text-sm font-medium">{likeCount}</p>
      </div>
    </button>
  );
};

export default LikeButton;
