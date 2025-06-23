import QuizForm from "@/components/Quiz/QuizForm";
import CommunityQuizForm from "@/components/Quiz/CommunityQuizForm";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Edit3, Check, X, FileText } from "lucide-react";
import { Upload } from "@prisma/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
type Props = {
  namespace: string;
  isPersonal: boolean;
  upload?: Upload;
  currentUserId?: string;
};
function LeftSideBar({ namespace, isPersonal, upload, currentUserId }: Props) {
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [uploadName, setUploadName] = useState(upload?.name || "");
  const [isLoading, setIsLoading] = useState(false);

  const canEdit = upload && currentUserId && upload.userId === currentUserId;

  const handleSave = async () => {
    if (!upload || !uploadName.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/uploads/${upload.id}/name`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: uploadName.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to update upload name");
      }

      const updatedUpload = await response.json();
      setUploadName(updatedUpload.name);
      setIsEditing(false);
      toast({
        //variant: "destructive",
        description: "Class Room Name updated successfully!",
      });
    } catch (error) {
      console.error("Error updating upload name:", error);
      toast({
        variant: "destructive",
        description: "Failed to update Class Room Name!",
      }); // Reset to original name on error
      setUploadName(upload.name || "");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setUploadName(upload?.name || "");
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  return (
    <div className="hidden md:flex flex-col w-64 flex-shrink-0 border-r border-gray-200 bg-gradient-to-br from-blue-50 to-green-50 h-full overflow-hidden">
      {/* Upload Name Section */}
      {upload && (
        <div className="px-4 py-3 border-b border-gray-200 bg-white/50">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={16} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-600">Classroom</span>
          </div>

          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 text-sm"
                disabled={isLoading}
                maxLength={100}
                autoFocus
              />
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleSave}
                  disabled={isLoading || !uploadName.trim()}
                  className="h-7 w-7 p-0"
                >
                  <Check size={14} className="text-green-600" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="h-7 w-7 p-0"
                >
                  <X size={14} className="text-red-600" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between group">
              <h3 className="text-sm font-semibold text-gray-800 truncate flex-1 mr-2">
                {uploadName || "Untitled Document"}
              </h3>
              {canEdit && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditing(true)}
                  className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Edit3 size={14} className="text-gray-500" />
                </Button>
              )}
            </div>
          )}
        </div>
      )}
      <CardHeader className="px-4 py-3 border-b border-gray-200 min-h-fit">
        <CardTitle className="text-lg font-medium text-gray-800 flex items-center gap-2">
          <MessageSquare size={18} className="text-gray-400" />
          Quiz Options
        </CardTitle>
      </CardHeader>
      <div className="flex-grow overflow-y-auto custom-scrollbar p-4">
        {namespace !== "undefined" ? (
          <div className="mb-4">
            {isPersonal ? (
              <QuizForm topic="" id={namespace} />
            ) : (
              <CommunityQuizForm topic="" id={namespace} />
            )}
          </div>
        ) : (
          <p> Upload a document to access this section</p>
        )}
      </div>
    </div>
  );
}

export default LeftSideBar;
