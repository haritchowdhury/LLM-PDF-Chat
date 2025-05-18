import { Card, CardContent } from "@/components/ui/card";
import { Award, Trophy } from "lucide-react";

type Props = {
  accuracy: number;
};

const ResultsCard = ({ accuracy }: Props) => {
  const getResultDetails = () => {
    if (accuracy > 75) {
      return {
        title: "Impressive!",
        subtitle: "> 75% accuracy",
        color: "text-yellow-400",
        iconColor: "text-yellow-400",
        bgGradient: "from-yellow-900/30 to-transparent",
      };
    } else if (accuracy > 25) {
      return {
        title: "Good job!",
        subtitle: "> 25% accuracy",
        color: "text-gray-300",
        iconColor: "text-gray-300",
        bgGradient: "from-gray-800/50 to-transparent",
      };
    } else {
      return {
        title: "Nice try!",
        subtitle: "< 25% accuracy",
        color: "text-yellow-700",
        iconColor: "text-yellow-700",
        bgGradient: "from-yellow-900/20 to-transparent",
      };
    }
  };

  const result = getResultDetails();

  return (
    <Card
      className={`border-none overflow-hidden bg-gradient-to-r ${result.bgGradient} rounded-lg`}
    >
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className="mr-6">
            <div className="p-3 rounded-full bg-gray-900/60 flex items-center justify-center">
              <Trophy className={`w-10 h-10 ${result.iconColor}`} />
            </div>
          </div>

          <div className="flex-1">
            <h2 className={`text-3xl font-bold ${result.color}`}>
              {result.title}
            </h2>
            <p className="text-sm opacity-70 mt-1">{result.subtitle}</p>
          </div>

          <div className="hidden sm:flex items-center justify-center">
            <Award className="w-6 h-6 text-gray-600 ml-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResultsCard;
