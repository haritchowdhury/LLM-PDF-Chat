"use client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const ChatButton = () => {
  const router = useRouter();
  const useChat = () => {
    router.push(`/chat`);
  };

  return (
    <div>
      <button
        onClick={useChat}
        style={{ padding: "5px 15px", cursor: "pointer" }}
      >
        Chat
      </button>
    </div>
  );
};
