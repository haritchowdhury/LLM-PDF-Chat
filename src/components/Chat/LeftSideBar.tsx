import QuizForm from "@/components/Quiz/QuizForm";
import CommunityQuizForm from "@/components/Quiz/CommunityQuizForm";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

type Props = {
  namespace: string;
  isPersonal: boolean;
};
function LeftSideBar({ namespace, isPersonal }: Props) {
  return (
    <div className="hidden md:flex flex-col w-64 flex-shrink-0 border-r border-gray-200 bg-gradient-to-br from-blue-50 to-green-50 h-full overflow-hidden">
      <CardHeader className="px-4 py-3 border-b border-gray-200 min-h-fit">
        <CardTitle className="text-lg font-medium text-gray-800 flex items-center gap-2">
          <MessageSquare size={18} className="text-gray-400" />
          Quiz Options
        </CardTitle>
      </CardHeader>
      <div className="flex-grow overflow-y-auto custom-scrollbar p-4">
        {namespace !== "undefined" && (
          <div className="mb-4">
            {isPersonal ? (
              <QuizForm topic="" id={namespace} />
            ) : (
              <CommunityQuizForm topic="" id={namespace} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default LeftSideBar;
