import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from "lucide-react";

type Props = {
  accuracy: number;
};

const AccuracyCard = ({ accuracy }: Props) => {
  accuracy = Math.round(accuracy * 100) / 100;

  return (
    <Card className="border border-gray-200 bg-white text-gray-800 rounded-lg overflow-hidden">
      <CardHeader className="pb-2 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Accuracy</CardTitle>
          <Target className="w-5 h-5 text-blue-400" />
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex items-end">
          <span className="text-3xl font-bold">{accuracy.toString()}</span>
          <span className="ml-1 text-xl text-blue-400">%</span>
        </div>
        <div className="w-full bg-gray-800 h-2 mt-3 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500"
            style={{ width: `${accuracy}%` }}
          ></div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccuracyCard;
