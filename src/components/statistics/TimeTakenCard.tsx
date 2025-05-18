import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { formatTimeDelta } from "@/lib/utils";
import { differenceInSeconds } from "date-fns";

type Props = {
  timeEnded: Date;
  timeStarted: Date;
};

const TimeTakenCard = ({ timeEnded, timeStarted }: Props) => {
  const totalSeconds = differenceInSeconds(timeEnded, timeStarted);
  const formattedTime = formatTimeDelta(totalSeconds);

  return (
    <Card className="border border-gray-800 bg-gray-900 text-white rounded-lg overflow-hidden">
      <CardHeader className="pb-2 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Time Taken</CardTitle>
          <Clock className="w-5 h-5 text-purple-400" />
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex items-end">
          <span className="text-3xl font-bold">{formattedTime}</span>
        </div>
        <div className="flex items-center mt-3 text-xs text-gray-400">
          <span>Started: {timeStarted.toLocaleTimeString()}</span>
          <span className="mx-1">•</span>
          <span>Finished: {timeEnded.toLocaleTimeString()}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default TimeTakenCard;
