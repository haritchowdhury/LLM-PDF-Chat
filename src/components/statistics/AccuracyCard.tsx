import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from "lucide-react";
type Props = { accuracy: number };

const AccuracyCard = ({ accuracy }: Props) => {
  accuracy = Math.round(accuracy * 100) / 100;
  return (
    <Card className="md:col-span-3 border-none bg-black text-white">
      <CardHeader className="flex flex-row   items-center  justify-between pb-2 space-y-0 ">
        <CardTitle className="text-lg font-bold">Average Accuracy</CardTitle>
        <Target className="w-4 h-4" />
      </CardHeader>
      <CardContent className=" bg-black text-white text-sm ">
        <div className="font-medium">{accuracy.toString() + "%"}</div>
      </CardContent>
    </Card>
  );
};

export default AccuracyCard;
